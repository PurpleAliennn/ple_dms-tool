"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CampaignOverviewPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch sections for this campaign, including their pages
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id, 
          name, 
          pages (id, label)
        `)
        .eq('campaign_id', campaignId);

      if (data) setSections(data);
    };
    fetchData();
  }, [campaignId]);

  return (
    <div>
      <h1>Campaign Home</h1>
      {sections.map((section) => (
        <div key={section.id} style={{ marginBottom: '20px' }}>
          <h2>{section.name}</h2>
          <ul>
            {section.pages.map((page: any) => (
              <li key={page.id}>
                <Link href={`/campaign/${campaignId}/page/${page.id}`}>
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}