export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export type Post = {
  id: number;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Hashtag = {
  id: number;
  name: string;
  created_at: string;
}

export type PostHashtag = {
  post_id: number;
  hashtag_id: number;
}

export type Like = {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}

export type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export type Friendship = {
  id: number;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}