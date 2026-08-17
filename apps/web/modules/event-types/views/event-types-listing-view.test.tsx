import { SchedulingType } from "@calcom/prisma/enums";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { InfiniteEventTypeList } from "./event-types-listing-view";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    usePathname: vi.fn(() => "/event-types"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  };
});

vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [null],
}));

vi.mock("@calcom/lib/hooks/useLocale", () => ({
  useLocale: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

vi.mock("@calcom/lib/hooks/useTheme", () => ({
  useGetTheme: () => ({ resolvedTheme: "light", forcedTheme: undefined }),
}));

vi.mock("@calcom/lib/hooks/useCopy", () => ({
  useCopy: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));

vi.mock("@calcom/ui/components/tooltip", () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
    <div data-testid="tooltip-wrapper" data-tooltip-content={content}>
      {children}
    </div>
  ),
}));

vi.mock("@calcom/web/modules/event-types/components", () => ({
  EventTypeDescription: () => null,
}));

vi.mock("@calcom/web/modules/embed/components/EventTypeEmbed", () => ({
  EventTypeEmbedButton: () => null,
  EventTypeEmbedDialog: () => null,
}));

vi.mock("@calcom/web/modules/event-types/components/CreateEventTypeDialog", () => ({
  CreateEventTypeDialog: () => null,
}));

vi.mock("@calcom/web/modules/event-types/components/DuplicateDialog", () => ({
  DuplicateDialog: () => null,
}));

vi.mock("@calcom/web/modules/event-types/components/SkeletonLoader", () => ({
  InfiniteSkeletonLoader: () => null,
}));

const mutateMock = vi.fn();
vi.mock("@calcom/trpc/react", () => ({
  trpc: {
    useUtils: () => ({
      viewer: {
        eventTypes: {
          getEventTypesFromGroup: {
            cancel: vi.fn(),
            getInfiniteData: vi.fn(),
            setInfiniteData: vi.fn(),
          },
        },
      },
    }),
    viewer: {
      loggedInViewerRouter: {
        eventTypeOrder: { useMutation: () => ({ mutate: mutateMock }) },
      },
      eventTypesHeavy: {
        update: { useMutation: () => ({ mutate: mutateMock }) },
      },
      eventTypes: {
        delete: { useMutation: () => ({ mutate: mutateMock, isPending: false }) },
      },
    },
  },
}));

const baseEventType = {
  id: 1,
  title: "30 Min Meeting",
  slug: "30-min",
  hidden: false,
  schedulingType: null,
  eventTypeColor: null,
  metadata: null,
  hashedLink: [],
  userId: 1,
  teamId: null,
  hosts: [],
  owner: { timeZone: "UTC" },
  team: null,
  users: [],
  isCurrentUserHost: false,
} as unknown as Parameters<typeof InfiniteEventTypeList>[0]["pages"] extends
  | { eventTypes: (infer T)[] }[]
  | undefined
  ? T
  : never;

const group = {
  profile: { slug: "john" },
  teamId: null,
  parentId: null,
  metadata: { readOnly: false },
} as unknown as Parameters<typeof InfiniteEventTypeList>[0]["group"];

function renderList(eventTypeOverrides: Partial<typeof baseEventType> = {}) {
  return render(
    <TooltipProvider>
      <InfiniteEventTypeList
        group={group}
        readOnly={false}
        bookerUrl="https://cal.local"
        pages={[
          {
            nextCursor: undefined,
            eventTypes: [{ ...baseEventType, ...eventTypeOverrides }],
          },
        ]}
      />
    </TooltipProvider>
  );
}

describe("InfiniteEventTypeList hidden indicator", () => {
  it("renders the hidden state as a Badge with the hidden-badge testid", () => {
    renderList({ hidden: true, schedulingType: null });

    const hiddenBadges = screen.getAllByTestId("hidden-badge");
    expect(hiddenBadges.length).toBeGreaterThan(0);
    for (const badge of hiddenBadges) {
      expect(badge).toHaveTextContent("hidden");
    }
  });

  it("does not render the hidden badge when the event type is visible", () => {
    renderList({ hidden: false, schedulingType: null });

    expect(screen.queryByTestId("hidden-badge")).not.toBeInTheDocument();
  });

  it("does not render the hidden badge for managed event types even when hidden", () => {
    renderList({ hidden: true, schedulingType: SchedulingType.MANAGED });

    expect(screen.queryByTestId("hidden-badge")).not.toBeInTheDocument();
  });

  it("wraps every hidden badge in a Tooltip explaining the hidden state", () => {
    renderList({ hidden: true, schedulingType: null });

    const hiddenBadges = screen.getAllByTestId("hidden-badge");
    expect(hiddenBadges.length).toBeGreaterThan(0);
    for (const badge of hiddenBadges) {
      const tooltipWrapper = badge.closest('[data-testid="tooltip-wrapper"]');
      expect(tooltipWrapper).not.toBeNull();
      expect(tooltipWrapper).toHaveAttribute("data-tooltip-content", "hidden_event_type_tooltip");
    }
  });
});
