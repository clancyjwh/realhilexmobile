import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Newspaper, ChevronLeft, ExternalLink, Loader2, Zap } from 'lucide-react';
import { getTieredNewsfeed } from '../lib/newsfeed';

export default function AINewsfeedPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await getTieredNewsfeed(category || 'all');
        if (data) setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [category]);

  const stories = useMemo(() => {
    const allStories: any[] = [];
    const seen = new Set();

    items.forEach(item => {
      let extracted: any[] = [];
      if (item.results) {
        if (typeof item.results === 'object') {
          extracted = item.results.top_stories || item.results.predictions || item.results.stories || item.results.items || [];
        } else if (typeof item.results === 'string') {
          try {
            const parsed = JSON.parse(item.results);
            extracted = parsed.top_stories || parsed.predictions || parsed.stories || parsed.items || [];
          } catch (e) {
            // ignore
          }
        }
      }
      if (extracted.length > 0) {
        extracted.forEach(story => {
          const title = story.title || story.headline || story.name || '';
          const url = story.source_url || story.url || '';
          const identifier = url || title;
          
          if (identifier && !seen.has(identifier)) {
            seen.add(identifier);
            allStories.push({
              ...story,
              _meta: { date: item.created_at }
            });
          }
        });
      }
    });
    return allStories;
  }, [items]);

  const title = category === 'predictions' ? 'Markets' : category === 'sports' ? 'Sports' : category === 'finance' ? 'Finance' : 'AI';

  return (
    <div className="flex-grow flex flex-col pb-[120px] bg-[#0a0a0f] p-4 font-sans text-white h-full overflow-y-auto">
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 flex items-center justify-between border-b border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors flex items-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#00D8FF]" />
          <h1 className="text-lg font-black italic uppercase tracking-widest">{title} News</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#00D8FF] animate-spin" />
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning intel...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">
            No intelligence found for this category.
          </div>
        ) : (
          stories.map((story, i) => {
            const displayTitle = story.title || story.headline || story.name || 'Breaking News';
            const displaySummary = story.summary ? (story.summary.split('. ')[0] + (story.summary.includes('.') ? '.' : '')) : '';

            return (
              <a 
                key={i} 
                href={story.source_url || story.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-[#12121a] border border-white/5 rounded-2xl p-5 shadow-lg active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-[15px] leading-snug text-white flex-1">
                    {displayTitle}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-[#00D8FF] shrink-0 mt-1 opacity-70" />
                </div>
                {displaySummary && (
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                    {displaySummary}
                  </p>
                )}
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
