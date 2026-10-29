import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_SPECS, PlatformId } from '@/lib/hashtag-data';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caption = '',
      platform = 'instagram',
      imageBase64,
      imageMimeType,
      useSearchGrounding = false,
    } = body as {
      caption?: string;
      platform?: PlatformId;
      imageBase64?: string;
      imageMimeType?: string;
      useSearchGrounding?: boolean;
    };

    if (!caption.trim() && !imageBase64) {
      return NextResponse.json(
        { error: 'Please provide a post caption or upload an image to analyze.' },
        { status: 400 }
      );
    }

    const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.instagram;

    const systemInstruction = `You are HASHTAGGER, an elite social media growth strategist and real-time hashtag intelligence engine.
Analyze the user's social media post caption and any attached image for ${spec.name}.
Generate 10 to 12 highly strategic, trend-aware hashtags categorized into three distinct tiers:
1. "emerging": Fast-rising, breakout trend-curve hashtags with high velocity and low competition.
2. "niche": Targeted community, aesthetic, or domain-specific hashtags with high conversion and moderate volume.
3. "high_volume": Broad discovery category anchors with massive reach.

Platform Context for ${spec.name}:
- Optimal tag count: ${spec.optimalTagCount.min} to ${spec.optimalTagCount.max} (ideal: ${spec.optimalTagCount.ideal})
- Ideal ratio: ${spec.idealRatio.emerging} emerging, ${spec.idealRatio.niche} niche, ${spec.idealRatio.highVolume} high_volume
- Algorithm focus: ${spec.algorithmFocus}

Rules:
- Every hashtag MUST start with '#' and be lowercase alphanumeric without spaces.
- Provide realistic, quantitative estimatedPosts (e.g. "28.4K", "410K", "2.6M") and weekly velocity strings (e.g. "+46% this week", "+18% this week").
- Assign a relevanceScore from 75 to 99 and a concise 1-sentence reason explaining why the tag fits the specific caption or visual elements.
- If an image is provided, explicitly describe the visual cues detected in visualInsights and incorporate them into the hashtag selection.`;

    const parts: Array<
      | { text: string }
      | { inlineData: { data: string; mimeType: string } }
    > = [];

    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    parts.push({
      text: `Target Platform: ${spec.name}
Post Caption / Draft:
"""
${caption.trim() || '(Image-only post — analyze visual composition, subject, mood, and aesthetic to recommend hashtags)'}
"""

Generate a structured tiered hashtag analysis for this post.`,
    });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: '1-sentence summary of the post theme, audience, and angle.',
        },
        visualInsights: {
          type: Type.STRING,
          description:
            'If an image was provided, summarize the visual objects, mood, lighting, and aesthetic cues detected. Otherwise summarize the implied visual hook.',
        },
        recommendedRatio: {
          type: Type.OBJECT,
          properties: {
            emerging: { type: Type.INTEGER },
            niche: { type: Type.INTEGER },
            highVolume: { type: Type.INTEGER },
          },
          required: ['emerging', 'niche', 'highVolume'],
        },
        platformTip: {
          type: Type.STRING,
          description: 'Actionable, platform-specific placement and timing advice for this specific post.',
        },
        hashtags: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tag: {
                type: Type.STRING,
                description: 'The hashtag starting with #, lowercase.',
              },
              tier: {
                type: Type.STRING,
                description: 'Must be one of: emerging, niche, high_volume',
              },
              estimatedPosts: {
                type: Type.STRING,
                description: 'Formatted post volume such as 34.2K, 520K, or 1.8M',
              },
              velocity: {
                type: Type.STRING,
                description: 'Formatted weekly trend velocity such as +42% this week',
              },
              competition: {
                type: Type.STRING,
                description: 'Must be one of: Low, Medium, High',
              },
              relevanceScore: {
                type: Type.INTEGER,
                description: 'Relevance score between 75 and 99',
              },
              reason: {
                type: Type.STRING,
                description: 'Concise reason why this hashtag boosts reach for this post.',
              },
            },
            required: [
              'tag',
              'tier',
              'estimatedPosts',
              'velocity',
              'competition',
              'relevanceScore',
              'reason',
            ],
          },
        },
      },
      required: ['summary', 'visualInsights', 'recommendedRatio', 'platformTip', 'hashtags'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        ...(useSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    // Extract grounding chunks if present
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .map((chunk: { web?: { title?: string; uri?: string } }) => ({
        title: chunk.web?.title || 'Live Trend Source',
        url: chunk.web?.uri || '',
      }))
      .filter((s: { url: string }) => Boolean(s.url));

    // Normalize tags and tiers
    const normalizedHashtags = (parsed.hashtags || []).map(
      (item: {
        tag?: string;
        tier?: string;
        estimatedPosts?: string;
        velocity?: string;
        competition?: string;
        relevanceScore?: number;
        reason?: string;
      }) => {
        const cleanTag = item.tag?.startsWith('#')
          ? item.tag.toLowerCase()
          : `#${(item.tag || 'trending').toLowerCase()}`;
        const validTier =
          item.tier === 'emerging' ||
          item.tier === 'niche' ||
          item.tier === 'high_volume'
            ? item.tier
            : 'niche';
        const validComp =
          item.competition === 'Low' ||
          item.competition === 'Medium' ||
          item.competition === 'High'
            ? item.competition
            : 'Medium';

        return {
          tag: cleanTag.replace(/\s+/g, ''),
          tier: validTier,
          estimatedPosts: item.estimatedPosts || '120K',
          velocity: item.velocity || '+24% this week',
          competition: validComp,
          relevanceScore:
            typeof item.relevanceScore === 'number'
              ? Math.min(99, Math.max(70, item.relevanceScore))
              : 90,
          reason:
            item.reason ||
            'Strong semantic alignment with post topic and audience intent.',
        };
      }
    );

    return NextResponse.json({
      summary:
        parsed.summary ||
        'Analyzed post content and visual cues for optimal reach.',
      visualInsights: parsed.visualInsights || '',
      recommendedRatio: parsed.recommendedRatio || spec.idealRatio,
      platformTip: parsed.platformTip || spec.placementGuidance,
      hashtags: normalizedHashtags,
      groundingSources,
    });
  } catch (error: unknown) {
    console.error('Error analyzing hashtags:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to analyze post with Gemini AI.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
