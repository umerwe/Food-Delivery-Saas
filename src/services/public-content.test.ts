import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAboutContent,
  fetchCustomerFaqs,
  fetchCustomerReviews,
  fetchBranchStats,
  fetchHelpSupportContent,
  normalizeAboutContent,
  normalizeBranchStats,
  normalizeCustomerFaqsResponse,
  normalizeCustomerReviewsResponse,
  normalizeHelpSupportContent,
  parseAboutPageContent,
  submitContactForm,
} from "./public-content";

const getRequestMock = vi.hoisted(() => vi.fn());
const postRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
  postRequest: postRequestMock,
}));

describe("public content service", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
  });

  it("normalizes about content safely", () => {
    expect(
      normalizeAboutContent({
        restaurantId: "restaurant-1",
        restaurantName: "Demo",
        tenantId: "tenant-1",
        tenantName: "Demo Tenant",
        restaurantCoverImage: null,
        title: "About",
        content: "<p>Fresh food.</p>",
      })
    ).toMatchObject({
      restaurantId: "restaurant-1",
      restaurantName: "Demo",
      tenantId: "tenant-1",
      tenantName: "Demo Tenant",
      restaurantCoverImage: null,
      title: "About",
      content: "<p>Fresh food.</p>",
    });
  });

  it("parses structured about page content from the backend HTML comment", () => {
    const encoded = encodeURIComponent(JSON.stringify({
      hero: {
        title: "About Us",
        subtitle: "Fresh food",
        imageUrl: "",
        ctaLabel: "Order Now",
        ctaHref: "/items",
      },
      story: {
        eyebrow: "Our Story",
        title: "Serving with care",
        paragraphs: "About Us\nFresh food.",
        imageUrl: "",
        badge: "Established with passion",
      },
      missionVisionValues: [{ title: "Mission", description: "Make every order memorable." }],
      whyChooseUs: [{ title: "Fast delivery", description: "Prepared with care." }],
      stats: [{ value: "10k+", label: "Happy customers" }],
      team: [{ name: "Team Member", role: "Founder", imageUrl: "" }],
      testimonials: [{ name: "Customer", role: "Regular", imageUrl: "", quote: "Great food.", rating: "5" }],
      cta: {
        title: "Order from our app",
        description: "Download the app.",
        imageUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        subscribeTitle: "Stay updated",
        subscribeDescription: "Subscribe for offers.",
      },
    }));

    const parsed = parseAboutPageContent(`<!-- deliveryway-about-page:${encoded} --><section />`);

    expect(parsed).toMatchObject({
      hero: { title: "About Us", subtitle: "Fresh food", imageUrl: null },
      story: { title: "Serving with care", badge: "Established with passion" },
      missionVisionValues: [{ title: "Mission" }],
      whyChooseUs: [{ title: "Fast delivery" }],
      stats: [{ value: "10k+", label: "Happy customers" }],
      team: [{ name: "Team Member", imageUrl: null }],
      testimonials: [{ name: "Customer", rating: 5 }],
      cta: { title: "Order from our app", appStoreUrl: null },
    });
  });

  it("fetches about content from the backend-supported public endpoint", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        restaurantId: "restaurant-1",
        restaurantName: "Demo",
        tenantId: "tenant-1",
        tenantName: "Demo Tenant",
        restaurantCoverImage: null,
        title: "About Us",
        content: "<p>Managed about content.</p>",
      },
    });

    await fetchAboutContent("restaurant-1");

    expect(getRequestMock).toHaveBeenCalledWith(
      "/v1/public-content/about-us?restaurantId=restaurant-1"
    );
  });

  it("normalizes branch stats numbers", () => {
    expect(
      normalizeBranchStats({
        completedOrders: "12",
        activeMenuItems: 8,
        reviewCount: "3",
        averageRating: "4.67",
        fiveStarReviews: "2",
      })
    ).toEqual({
      completedOrders: 12,
      activeMenuItems: 8,
      reviewCount: 3,
      averageRating: 4.67,
      fiveStarReviews: 2,
    });
  });

  it("fetches branch stats with restaurant and branch params", async () => {
    getRequestMock.mockResolvedValue({
      data: { data: { completedOrders: 5 } },
    });

    await fetchBranchStats("restaurant-1", "branch-1");

    expect(getRequestMock).toHaveBeenCalledWith(
      "/customer-app/branch-stats?restaurantId=restaurant-1&branchId=branch-1"
    );
  });

  it("normalizes customer reviews response", () => {
    expect(
      normalizeCustomerReviewsResponse({
        data: {
          items: [
            {
              id: "review-1",
              restaurantId: "restaurant-1",
              branchId: "branch-1",
              orderId: "order-1",
              rating: "5",
              comment: "Great",
              createdAt: "2026-06-18T00:00:00.000Z",
              customer: {
                id: "customer-1",
                firstName: "Ada",
                lastName: null,
                avatarUrl: null,
              },
              branch: { id: "branch-1", name: "Main" },
            },
          ],
          summary: {
            reviewCount: "1",
            averageRating: "5",
          },
        },
        meta: {
          page: "1",
          limit: "10",
          total: "1",
          totalPages: "1",
          hasNext: false,
          hasPrevious: false,
        },
      })
    ).toMatchObject({
      items: [{ id: "review-1", rating: 5, comment: "Great" }],
      summary: { reviewCount: 1, averageRating: 5 },
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("fetches customer reviews with restaurant, branch, pagination, and rating params", async () => {
    getRequestMock.mockResolvedValue({
      data: { data: { items: [], summary: { reviewCount: 0, averageRating: null } } },
      meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    await fetchCustomerReviews({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 2,
      limit: 5,
      rating: 5,
    });

    expect(getRequestMock).toHaveBeenCalledWith(
      "/customer-app/reviews?page=2&limit=5&restaurantId=restaurant-1&branchId=branch-1&rating=5"
    );
  });

  it("normalizes help support content", () => {
    expect(
      normalizeHelpSupportContent({
        restaurantId: "restaurant-1",
        restaurantCoverImage: null,
        branchId: "branch-1",
        title: "Help & Support",
        content: "<p>Need help?</p>",
        contacts: {
          phone: "+923001234567",
          whatsapp: "+923001234567",
          email: "support@example.com",
        },
      })
    ).toEqual({
      restaurantId: "restaurant-1",
      restaurantCoverImage: null,
      branchId: "branch-1",
      title: "Help & Support",
      content: "<p>Need help?</p>",
      contacts: {
        phone: "+923001234567",
        whatsapp: "+923001234567",
        email: "support@example.com",
      },
    });
  });

  it("fetches help support content with restaurant and branch params", async () => {
    getRequestMock.mockResolvedValue({
      data: { restaurantId: "restaurant-1", contacts: {} },
    });

    await fetchHelpSupportContent("restaurant-1", "branch-1");

    expect(getRequestMock).toHaveBeenCalledWith(
      "/v1/public-content/help-support?restaurantId=restaurant-1&branchId=branch-1"
    );
  });

  it("normalizes customer FAQs response", () => {
    expect(
      normalizeCustomerFaqsResponse({
        data: {
          restaurantId: "restaurant-1",
          branchId: "branch-1",
          categories: ["Orders"],
          items: [
            {
              id: "faq-1",
              question: "Where is my order?",
              answer: "Track it from order history.",
              category: "Orders",
            },
            { id: "bad-faq", question: "", answer: "" },
          ],
        },
      })
    ).toMatchObject({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categories: ["Orders"],
      items: [{ id: "faq-1", question: "Where is my order?" }],
    });
  });

  it("fetches customer FAQs with restaurant and branch params", async () => {
    getRequestMock.mockResolvedValue({
      data: { data: { items: [] } },
    });

    await fetchCustomerFaqs("restaurant-1", "branch-1");

    expect(getRequestMock).toHaveBeenCalledWith(
      "/v1/public-content/faqs?restaurantId=restaurant-1&branchId=branch-1"
    );
  });

  it("submits contact form to public content endpoint", async () => {
    postRequestMock.mockResolvedValue({ success: true, data: {} });

    await submitContactForm("restaurant-1", "branch-1", {
      name: "Ada",
      email: "ada@example.com",
      subject: "Support",
      message: "Hello",
    });

    expect(postRequestMock).toHaveBeenCalledWith(
      "/v1/public-content/contact-form?restaurantId=restaurant-1&branchId=branch-1",
      {
        name: "Ada",
        email: "ada@example.com",
        subject: "Support",
        message: "Hello",
      }
    );
  });
});
