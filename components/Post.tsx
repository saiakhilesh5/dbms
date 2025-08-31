"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "./ui/badge";
import ReactTimeago from "react-timeago";
import { Button } from "./ui/button";
import deletePostAction from "@/actions/deletePostAction";
import { Trash2, Heart, MessageCircle, ThumbsDown } from "lucide-react";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import React from "react";

interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  userImage: string;
}

interface IPost {
  id: string;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
  user: IUser;
}

interface IComment {
  id: string;
  user: IUser;
  text: string;
  createdAt: string;
}

function Post({ post }: { post: IPost }) {
  const { user } = useUser();
  const isAuthor = user?.id === post.user.userId;

  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const fetchLikesDislikes = useCallback(async () => {
    try {
      const [likesRes, dislikesRes] = await Promise.all([
        fetch(`/api/posts/${post.id}/like`),
        fetch(`/api/posts/${post.id}/dislike`)
      ]);

      const likesData: string[] = await likesRes.json();
      const dislikesData: string[] = await dislikesRes.json();

      setLikes(likesData);
      setDislikes(dislikesData);
      setIsLiked(user?.id ? likesData.includes(user.id) : false);
      setIsDisliked(user?.id ? dislikesData.includes(user.id) : false);
    } catch (error) {
      console.error("Error fetching likes/dislikes:", error);
    }
  }, [post.id, user?.id]);

  useEffect(() => {
    fetchLikesDislikes();
  }, [fetchLikesDislikes]);

  const handleLike = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        fetchLikesDislikes();
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDislike = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/dislike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        fetchLikesDislikes();
      }
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="bg-[#18181b] rounded-xl border border-[#3f3f46] mb-4 shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="flex p-4 space-x-4 items-start">
        <Avatar className="h-16 w-16 rounded-full border-4 border-[#18181b] shadow">
          <AvatarImage src={post.user.userImage} />
          <AvatarFallback>
            {post.user.firstName?.charAt(0)}
            {post.user.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex justify-between flex-1">
          <div>
            <p className="font-semibold text-white">
              {post.user.firstName} {post.user.lastName}{" "}
              {isAuthor && <Badge className="ml-2" variant="secondary">Author</Badge>}
            </p>
            <p className="text-xs text-gray-400">
              @{post.user.firstName}-{post.user.userId.slice(-4)}
            </p>
            <p className="text-xs text-gray-400">
              <ReactTimeago date={new Date(post.createdAt)} />
            </p>
          </div>

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deletePostAction(post.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        <p className="text-white mb-4">{post.text}</p>

        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt="Post Image"
            width={500}
            height={500}
            className="w-full rounded-lg mb-4"
          />
        )}

        {/* Interaction Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <span>{likes.length} likes</span>
            <span>{dislikes.length} dislikes</span>
            <span>{showComments ? <CommentSection postId={post.id} /> : 0} comments</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-[#3f3f46] pt-4">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${isLiked ? "text-blue-500" : "text-gray-400 hover:text-blue-500"}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span>Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`flex items-center space-x-2 ${isDisliked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
            >
              <ThumbsDown size={18} fill={isDisliked ? "currentColor" : "none"} />
              <span>Dislike</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommentToggle}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-500"
            >
              <MessageCircle size={18} />
              <span>Comment</span>
            </Button>
          </div>
        </div>

        {showComments && <CommentSection postId={post.id} />}
      </div>
    </div>
  );
}

// Comment Section
function CommentSection({ postId }: { postId: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data: IComment[] = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async () => {
    if (!user?.id || !newComment.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            userId: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            userImage: user.imageUrl || "",
          },
          text: newComment
        })
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-[#3f3f46]">
      <div className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <Button onClick={addComment} disabled={loading || !newComment.trim()} size="sm">
          {loading ? "Posting..." : "Post"}
        </Button>
      </div>

      {comments.map(comment => {
        const isCommentAuthor = user?.id === comment.user.userId;
        return (
          <div key={comment.id} className="bg-[#27272a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user.userImage} />
                  <AvatarFallback className="text-xs">{comment.user.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white">{comment.user.firstName} {comment.user.lastName}</span>
                <span className="text-xs text-gray-400"><ReactTimeago date={new Date(comment.createdAt)} /></span>
              </div>
              {isCommentAuthor && (
                <Button variant="ghost" size="sm" onClick={() => deleteComment(comment.id)} className="text-red-500 hover:text-red-700 p-1 h-auto">
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-300">{comment.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export default Post;
