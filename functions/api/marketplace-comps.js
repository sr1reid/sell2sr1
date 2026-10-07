/**
 * Cloudflare Pages Function: /api/marketplace-comps
 * 
 * Proxies search requests to the Apify Facebook Marketplace Scraper Actor
 * using the secret APIFY_TOKEN environment variable configured in Cloudflare Pages.
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Set up CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = env.APIFY_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'APIFY_TOKEN environment variable is not configured in Cloudflare Pages settings.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    let query = '';
    let location = 'manchester';
    let maxItems = 6;
    let actorId = 'apify~facebook-marketplace-scraper';

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        query = body.query || '';
        location = body.location || location;
        maxItems = body.maxItems || maxItems;
        if (body.actorId) actorId = body.actorId;
      } catch (e) {
        // Fall back to URL params
      }
    }

    if (!query) {
      const url = new URL(request.url);
      query = url.searchParams.get('query') || url.searchParams.get('q') || '';
      location = url.searchParams.get('location') || location;
      maxItems = Number(url.searchParams.get('maxItems')) || maxItems;
      if (url.searchParams.get('actorId')) actorId = url.searchParams.get('actorId');
    }

    if (!query.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required search query (e.g. ?query=2021+Keystone+Cougar)'
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Construct search URL and queries for Facebook Marketplace
    const searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query.trim())}`;
    
    const actorInput = {
      startUrls: [{ url: searchUrl }],
      searchQueries: [
        { query: query.trim(), city: location }
      ],
      maxItems: maxItems,
      maxResults: maxItems,
      resultsLimit: maxItems
    };

    // Execute Apify Actor synchronously (waits up to 45 seconds for scraper dataset)
    const apifyEndpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=45`;

    const apifyResponse = await fetch(apifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(actorInput)
    });

    if (!apifyResponse.ok) {
      const errText = await apifyResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Apify API returned HTTP ${apifyResponse.status}: ${errText}`
        }),
        { status: apifyResponse.status, headers: corsHeaders }
      );
    }

    const rawItems = await apifyResponse.json();
    const itemsList = Array.isArray(rawItems) ? rawItems : [];

    // Normalize items into consistent structure for SR1 Staff Portal
    const normalizedItems = itemsList.slice(0, maxItems).map((item, idx) => {
      let priceDisplay = 'Contact for Price';
      if (item.price !== undefined && item.price !== null) {
        if (typeof item.price === 'number') {
          priceDisplay = `$${item.price.toLocaleString()}`;
        } else {
          priceDisplay = String(item.price);
          if (!priceDisplay.startsWith('$') && !isNaN(Number(priceDisplay))) {
            priceDisplay = `$${Number(priceDisplay).toLocaleString()}`;
          }
        }
      } else if (item.formattedPrice) {
        priceDisplay = item.formattedPrice;
      }

      let locationDisplay = 'New England Area';
      if (typeof item.location === 'string') {
        locationDisplay = item.location;
      } else if (item.location?.reverse_geocode?.city) {
        locationDisplay = `${item.location.reverse_geocode.city}, ${item.location.reverse_geocode.state || ''}`.trim();
      } else if (item.locationText) {
        locationDisplay = item.locationText;
      }

      let listingUrl = '#';
      if (item.url) {
        listingUrl = item.url.startsWith('http') ? item.url : `https://www.facebook.com${item.url}`;
      } else if (item.id) {
        listingUrl = `https://www.facebook.com/marketplace/item/${item.id}`;
      }

      const imageUrl = item.primaryImage || item.image || item.thumbnail || item.imageUrl || null;

      return {
        id: item.id || `comp-${idx}`,
        title: item.title || item.name || item.text || query,
        price: priceDisplay,
        rawPrice: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || '').replace(/[^0-9.]/g, '')) || null,
        location: locationDisplay,
        url: listingUrl,
        imageUrl: imageUrl,
        marketplaceCategory: item.marketplaceListingCategory || item.category || null
      };
    });

    // Calculate quick stats across found comps
    const numericPrices = normalizedItems.map(i => i.rawPrice).filter(p => p !== null && !isNaN(p) && p > 0);
    const avgPrice = numericPrices.length > 0 
      ? Math.round(numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length)
      : null;
    const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
    const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : null;

    return new Response(
      JSON.stringify({
        success: true,
        query: query,
        count: normalizedItems.length,
        stats: {
          averagePrice: avgPrice,
          minPrice: minPrice,
          maxPrice: maxPrice,
          averagePriceFormatted: avgPrice ? `$${avgPrice.toLocaleString()}` : null
        },
        items: normalizedItems,
        directSearchUrl: searchUrl
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error while fetching comps'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
