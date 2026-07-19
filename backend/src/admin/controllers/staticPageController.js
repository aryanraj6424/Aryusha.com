import StaticPage from "../models/StaticPage.js";
import Vendor from "../../vendor/models/Vendor.js";

const VALID_PAGES = {
  "privacy-policy": "Privacy Policy",
  "terms-conditions": "Terms & Conditions",
  "about-us": "About Us",
  "customer-support": "Customer Support",
  "faq": "FAQ",
  "delivery-area": "Delivery Area"
};

// Get or initialize a static page
export const getStaticPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!VALID_PAGES[slug]) {
      return res.status(400).json({ success: false, message: "Invalid page slug" });
    }

    let page = await StaticPage.findOne({ slug });
    if (!page) {
      page = await StaticPage.create({
        slug,
        title: VALID_PAGES[slug],
        content: `<h1>${VALID_PAGES[slug]}</h1><p>Default content for ${VALID_PAGES[slug]}. Update this content using the admin panel.</p>`
      });
    }

    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a static page's content (Admin only)
export const updateStaticPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { content, title } = req.body;
    
    if (!VALID_PAGES[slug]) {
      return res.status(400).json({ success: false, message: "Invalid page slug" });
    }

    let page = await StaticPage.findOne({ slug });
    if (!page) {
      page = new StaticPage({ slug, title: title || VALID_PAGES[slug] });
    }
    
    page.content = content;
    if (title) page.title = title;
    page.lastUpdatedBy = req.admin?._id || null;
    
    await page.save();
    
    res.status(200).json({ success: true, message: "Page updated successfully", page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all static pages summaries (Admin only)
export const getStaticPagesList = async (req, res) => {
  try {
    const pages = [];
    for (const [slug, title] of Object.entries(VALID_PAGES)) {
      let page = await StaticPage.findOne({ slug }).select("slug title content updatedAt");
      if (!page) {
        page = await StaticPage.create({
          slug,
          title,
          content: `<h1>${title}</h1><p>Default content for ${title}. Update this content using the admin panel.</p>`
        });
      }
      pages.push(page);
    }
    res.status(200).json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dynamic cities served list
export const getCitiesServed = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: "approved" }).select("storeDetails.city serviceAreas");
    const citiesSet = new Set();
    vendors.forEach((vendor) => {
      if (vendor.storeDetails?.city) {
        citiesSet.add(vendor.storeDetails.city);
      }
      if (Array.isArray(vendor.serviceAreas)) {
        vendor.serviceAreas.forEach((sa) => {
          if (sa.city) {
            citiesSet.add(sa.city);
          }
        });
      }
    });
    const cities = [...citiesSet].filter(Boolean);
    res.status(200).json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
