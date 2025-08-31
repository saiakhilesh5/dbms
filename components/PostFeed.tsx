import Post from "./Post";

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

function PostFeed({ posts }: { posts: IPost[] }) {
  return (
    <div className="space-y-2 pb-20">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}

export default PostFeed;
