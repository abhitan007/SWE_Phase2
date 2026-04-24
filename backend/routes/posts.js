const router = require('express').Router();
const multer = require('multer');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/postController');

// Memory storage — no disk writes
const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function uploadMiddleware(req, res, next) {
  postUpload.single('attachment')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(400).json({ error: err.message || 'File upload failed' });
    next();
  });
}

// Student: get their enrolled course offerings
router.get('/my-offerings', authenticate, authorizeRoles('student'), ctrl.getStudentCourseOfferings);

// Specific post actions (must be before /:courseOfferingId to avoid shadowing)
router.delete('/post/:postId', authenticate, ctrl.deletePost);
router.get('/post/:postId/attachment', authenticate, ctrl.downloadAttachment);
router.post('/post/:postId/replies', authenticate, ctrl.addReply);
router.delete('/post/:postId/replies/:replyId', authenticate, ctrl.deleteReply);

// Course feed
router.get('/:courseOfferingId', authenticate, ctrl.getPosts);
router.post('/:courseOfferingId', authenticate, authorizeRoles('faculty', 'admin'), uploadMiddleware, ctrl.createPost);

module.exports = router;
