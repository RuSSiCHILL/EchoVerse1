'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Grid, 
  List, 
  Users, 
  Image, 
  ThumbsUp,
  MessageSquare,
  Heart
} from 'lucide-react';

interface ProfileTabsProps {
  userId: string;
  counts: {
    posts: number;
    friends: number;
    photos: number;
    likes: number;
    comments: number;
  };
}

export default function ProfileTabs({ userId, counts }: ProfileTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { 
      id: 'posts', 
      label: 'Посты', 
      icon: <List size={18} />,
      count: counts.posts,
      href: `/profile/${userId}`
    },
    { 
      id: 'friends', 
      label: 'Друзья', 
      icon: <Users size={18} />,
      count: counts.friends,
      href: `/profile/${userId}/friends`
    },
    { 
      id: 'photos', 
      label: 'Фото', 
      icon: <Image size={18} />,
      count: counts.photos,
      href: `/profile/${userId}/photos`
    },
    { 
      id: 'likes', 
      label: 'Лайки', 
      icon: <ThumbsUp size={18} />,
      count: counts.likes,
      href: `/profile/${userId}/likes`
    },
    { 
      id: 'comments', 
      label: 'Комментарии', 
      icon: <MessageSquare size={18} />,
      count: counts.comments,
      href: `/profile/${userId}/comments`
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}