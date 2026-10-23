import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { prisma } from '../utils/db.js';
import { requireSession } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentRoot = path.resolve(__dirname, '..', '..', 'uploads', 'content');
const contentFileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { ok: false, message: 'Too many content file requests. Try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function safeFilename(value) {
  const decoded = decodeURIComponent(String(value || ''));
  if (!decoded || decoded !== path.basename(decoded) || decoded.includes('\0')) return '';
  if (!/^[A-Za-z0-9._-]{1,255}$/.test(decoded)) return '';
  return decoded;
}

function directAssignmentWhere(trainee, employeeId) {
  const OR = [
    { assignedTo: employeeId, assignedToType: 'individual' },
    { assignedToType: 'company' },
  ];
  if (trainee.batchNo) OR.push({ assignedTo: trainee.batchNo, assignedToType: 'batch' });
  if (trainee.process) OR.push({ assignedTo: trainee.process, assignedToType: 'process' });
  if (trainee.branch) OR.push({ assignedTo: trainee.branch, assignedToType: 'branch' });
  return { active: true, OR };
}

async function hasDirectModuleAccess(trainee, moduleIds) {
  const ids = (Array.isArray(moduleIds) ? moduleIds : [moduleIds]).filter(Boolean);
  if (!ids.length) return false;
  const assignment = await prisma.assignedModule.findFirst({
    where: { ...directAssignmentWhere(trainee, trainee.employeeId), moduleId: { in: ids } },
    select: { id: true },
  });
  return Boolean(assignment);
}

async function repositoryFileAccess(trainee, filename) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT m.module_id
       FROM content_repository_master r
       INNER JOIN independent_module_content_map m ON m.repository_content_id = r.repository_content_id
       INNER JOIN independent_module_master im ON im.module_id = m.module_id
       WHERE r.status = 'Active' AND m.active = 1 AND im.status = 'Active'
         AND (REPLACE(r.direct_media_url, '\\\\', '/') LIKE ? OR REPLACE(r.local_file_path, '\\\\', '/') LIKE ?)
       LIMIT 50`,
      `%/${filename}`,
      `%/${filename}`,
    );
    const moduleIds = [...new Set((rows || []).map(row => row.module_id).filter(Boolean))];
    return moduleIds.length ? hasDirectModuleAccess(trainee, moduleIds) : false;
  } catch {
    return false;
  }
}

async function traineeCanAccess(employeeId, filename) {
  const trainee = await prisma.traineeMaster.findUnique({
    where: { employeeId },
    select: { employeeId: true, classroomId: true, batchNo: true, process: true, branch: true },
  });
  if (!trainee) return false;

  const contents = await prisma.contentMaster.findMany({
    where: {
      active: true,
      directMediaUrl: { endsWith: `/${filename}` },
      module: { active: true },
    },
    select: {
      moduleId: true,
      module: { select: { classroomId: true } },
    },
    take: 100,
  });

  const classroomIds = [...new Set(contents.map(row => row.module?.classroomId).filter(Boolean))];
  if (classroomIds.length) {
    if (trainee.classroomId && classroomIds.includes(trainee.classroomId)) return true;

    const mapping = await prisma.traineeClassroomMap.findFirst({
      where: { employeeId, classroomId: { in: classroomIds }, active: true },
      select: { id: true },
    });
    if (mapping) return true;
  }

  // Content served from a module that was assigned directly to this learner
  // (individual, batch, process, branch or company) must stay playable even
  // when the learner is not a member of the module's classroom.
  const moduleIds = [...new Set(contents.map(row => row.moduleId).filter(Boolean))];
  if (moduleIds.length && await hasDirectModuleAccess(trainee, moduleIds)) return true;

  return repositoryFileAccess(trainee, filename);
}

router.get('/files/:filename', contentFileLimiter, requireSession, async (req, res, next) => {
  try {
    const filename = safeFilename(req.params.filename);
    if (!filename) return res.status(400).json({ ok: false, message: 'Invalid content filename.' });

    const target = path.resolve(contentRoot, filename);
    if (!target.startsWith(`${contentRoot}${path.sep}`)) {
      return res.status(400).json({ ok: false, message: 'Invalid content path.' });
    }

    const stat = await fs.promises.stat(target).catch(() => null);
    if (!stat?.isFile()) return res.status(404).json({ ok: false, message: 'Content file not found.' });

    if (req.userType === 'trainee' && !await traineeCanAccess(req.userId, filename)) {
      return res.status(403).json({ ok: false, message: 'This file is not assigned to your classroom.' });
    }
    if (!['trainee', 'coordinator', 'admin'].includes(req.userType)) {
      return res.status(403).json({ ok: false, message: 'Learning-content access denied.' });
    }

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${filename.replaceAll('"', '')}"`);
    return res.sendFile(filename, { root: contentRoot, dotfiles: 'deny', acceptRanges: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
