const Post = require('../models/Post');
const Enrollment = require('../models/Enrollment');
const { toDataUrl, sendDataUrl } = require('../utils/fileHelper');

exports.createPost = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Post body is required' });

    const postData = {
      body: body.trim(),
      courseOffering: courseOfferingId,
      author: req.user.userId,
    };

    if (req.file) {
      postData.attachment = {
        fileName: req.file.originalname,
        fileData: toDataUrl(req.file),
        fileSize: req.file.size,
      };
    }

    const post = await Post.create(postData);
    await post.populate([
      { path: 'author', select: 'name role' },
      { path: 'replies.author', select: 'name role' },
    ]);
    const out = post.toObject();
    if (out.attachment) delete out.attachment.fileData;
    res.status(201).json(out);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: err.message || 'Failed to create post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const { role, userId } = req.user;

    if (role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: userId,
        courseOffering: courseOfferingId,
        status: { $in: ['enrolled', 'completed'] },
      });
      if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const posts = await Post.find({ courseOffering: courseOfferingId })
      .select('-attachment.fileData')
      .populate('author', 'name role')
      .populate('replies.author', 'name role')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { postId } = req.params;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.replies.push({ author: req.user.userId, body: body.trim() });
    await post.save();
    await post.populate([
      { path: 'author', select: 'name role' },
      { path: 'replies.author', select: 'name role' },
    ]);
    const out = post.toObject();
    if (out.attachment) delete out.attachment.fileData;
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { postId, replyId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const reply = post.replies.id(replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    if (req.user.role !== 'admin' && reply.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    reply.deleteOne();
    await post.save();
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reply' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (req.user.role !== 'admin' && post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post?.attachment?.fileData) return res.status(404).json({ error: 'No attachment' });
    sendDataUrl(res, post.attachment.fileData, post.attachment.fileName || 'attachment');
  } catch (err) {
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

exports.getStudentCourseOfferings = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user.userId,
      status: { $in: ['enrolled', 'completed'] },
    }).populate({
      path: 'courseOffering',
      populate: { path: 'course', select: 'code name' },
    });
    const offerings = enrollments.map(e => e.courseOffering).filter(Boolean);
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offerings' });
  }
};
