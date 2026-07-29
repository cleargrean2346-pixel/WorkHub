import Link from 'next/link';
import { createPost } from '../actions';

export default function NewPostPage() {
  return <main className="onboarding"><section className="onboarding-card"><Link className="brand" href="/posts"><span className="brand-mark">W</span><span>workhub</span></Link><p className="eyebrow"><span /> NEW POST</p><h1>Write a post</h1><form action={createPost}><label htmlFor="title">Title</label><input id="title" name="title" required maxLength={200} placeholder="Share an update or guide" /><label htmlFor="body">Content</label><textarea id="body" name="body" rows={12} placeholder="Write in plain text or Markdown..." /><label><input type="checkbox" name="publish" /> Publish immediately</label><button className="primary">Save post</button></form></section></main>;
}
