import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";

export interface BlogItem {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  to?: string;
}

const BlogCard = ({ post }: { post: BlogItem }) => (
  <article className="group h-full bg-card border border-border rounded-2xl overflow-hidden shadow-card hover-lift">
    <div className="relative aspect-[16/10] overflow-hidden">
      <img
        src={post.image}
        alt={post.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-110 transition-spring duration-700"
      />
      <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
        {post.category}
      </span>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span>{post.author}</span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {post.readTime}
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-primary mb-2 leading-snug group-hover:text-accent transition-smooth">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {post.excerpt}
      </p>
      <Link
        to={post.to ?? "#"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:text-accent transition-smooth"
      >
        Read article <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
);

export default BlogCard;
