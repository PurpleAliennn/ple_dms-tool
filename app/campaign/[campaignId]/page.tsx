"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CampaignOverviewPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const router = useRouter();
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

console.log("Component Mounted! Campaign ID:", campaignId);

  useEffect(() => {
    const fetchData = async () => {
  setIsLoading(true);
  console.log("Starting fetch for campaign:", campaignId);

  const { data: sectionsData, error: secError } = await supabase
    .from('sections')
    .select('id')
    .eq('campaign_id', campaignId);

  if (secError) {
    console.error("DEBUG: Sections Query Error:", secError);
    setIsLoading(false);
    return;
  }
  
  console.log("DEBUG: Sections found:", sectionsData);

  if (!sectionsData || sectionsData.length === 0) {
    console.log("DEBUG: No sections found for campaign:", campaignId);
    setIsLoading(false);
    return;
  }

  const sectionIds = sectionsData.map(s => s.id);

  const { data: pagesData, error: pageError } = await supabase
    .from('pages')
    .select('id, section_id')
    .in('section_id', sectionIds);

  if (pageError) {
    console.error("DEBUG: Pages Query Error:", pageError);
    setIsLoading(false);
    return;
  }

  console.log("DEBUG: Pages found:", pagesData);

  if (pagesData && pagesData.length > 0) {
    console.log("DEBUG: Redirecting to:", pagesData[0].id);
    router.replace(`/campaign/${campaignId}/${pagesData[0].id}`);
  } else {
    console.log("DEBUG: No pages exist for these sections.");
    setIsLoading(false);
  }
};

    fetchData();
  }, [campaignId, router]);

  if (isLoading) return <div>Loading...</div>;


  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to your new Campaign!</h1>
      <p>It looks like you haven't created any pages yet.</p>
      <h3>Getting Started:</h3>
      <ul>
        <li>Create a category with the button in the sidebar.</li>
        <li>Now you can open the category and add a page to it!</li>
        <li>Within a page you can add cards to customise how you want to track your campaign</li>
      </ul>
    </div>
  );
}