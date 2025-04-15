const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/authMiddleware');

// Get all comments for a blog
router.get('/blog/:blogId', async (req, res) => {
    try {
        const comments = await Comment.find({ blog: req.params.blogId })
            .populate('user', 'username email profileImage')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// Add a new comment
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Validate input
        if (!req.body.content || !req.body.content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }
        if (!req.body.blogId) {
            return res.status(400).json({ message: 'Blog ID is required' });
        }

        const comment = new Comment({
            content: req.body.content.trim(),
            blog: req.body.blogId,
            user: req.user.id
        });

        await comment.save();
        
        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'username email profileImage');
        
        res.status(201).json({
            message: 'Comment added successfully',
            comment: populatedComment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(400).json({ 
            message: 'Error creating comment',
            error: error.message 
        });
    }
});

// Update a comment
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // Validate input
        if (!req.body.content || !req.body.content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the owner of the comment
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        comment.content = req.body.content.trim();
        comment.updatedAt = Date.now();
        await comment.save();
        
        const updatedComment = await Comment.findById(comment._id)
            .populate('user', 'username email profileImage');

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(400).json({ 
            message: 'Error updating comment',
            error: error.message 
        });
    }
});

// Delete a comment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the owner of the comment
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.json({ 
            message: 'Comment deleted successfully',
            commentId: req.params.id
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(400).json({ 
            message: 'Error deleting comment',
            error: error.message 
        });
    }
});

module.exports = router; 