import { describe, expect, it } from "vitest";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import {
  createPhase0Draft,
  createPhase0DraftForRecord,
  createPhase0Judgement,
  getDisplayStatusForNextStep,
  getNextStepLabel,
  shouldShowHumanReviewNote,
} from "../src/features/phase-0/phase0-heuristics";

describe("phase 0 heuristics", () => {
  it("loads the current phase 0 messy data", () => {
    expect(messyReports).toHaveLength(12);
    expect(messyReports.map((record) => record.id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `M-${String(index + 1).padStart(3, "0")}`,
      ),
    );
  });

  it("creates conservative safety placeholders for all records", () => {
    const judgements = messyReports.map(createPhase0Judgement);

    expect(judgements).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.unsafeToActDirectly),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.possibleKind === "unknown"),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.confidence === "low"),
    ).toHaveLength(messyReports.length);
  });

  it("does not treat review-needed records as confirmed facts", () => {
    const judgement = createPhase0Judgement(messyReports[9]);

    expect(messyReports[9].verificationStatus).toBe("needs_review");
    expect(judgement.unsafeToActDirectly).toBe(true);
    expect(judgement.evidence.join(" ")).not.toContain("verified");
  });

  it("does not infer candidate kind from the starter text", () => {
    const judgement = createPhase0Judgement(messyReports[10]);

    expect(judgement.possibleKind).toBe("unknown");
    expect(judgement.suggestedNextStep).toBe("send_to_human_review");
  });

  it("creates a safe initial draft for a messy record", () => {
    const draft = createPhase0Draft("M-001");

    expect(draft.messyRecordId).toBe("M-001");
    expect(draft.possibleKind).toBe("unknown");
    expect(draft.confidence).toBe("low");
    expect(draft.suggestedNextStep).toBe("send_to_human_review");
    expect(draft.unsafeToActDirectly).toBe(true);
    expect(draft.evidence).toBe("");
    expect(draft.blockers).toBe("");
  });

  it("prefills an example draft for M-001", () => {
    const draft = createPhase0DraftForRecord(messyReports[0]);

    expect(draft.messyRecordId).toBe("M-001");
    expect(draft.possibleKind).toBe("help_request_candidate");
    expect(draft.confidence).toBe("low");
    expect(draft.suggestedNextStep).toBe("send_to_human_review");
    expect(draft.evidence).toContain("原文提到需要十幾個人清泥");
    expect(draft.blockers).toContain("地點表述不夠精確");
    expect(draft.unsafeToActDirectly).toBe(true);
  });

  it("prefills an example draft for M-002", () => {
    const draft = createPhase0DraftForRecord(messyReports[1]);

    expect(draft.messyRecordId).toBe("M-002");
    expect(draft.possibleKind).toBe("site_status_candidate");
    expect(draft.confidence).toBe("medium");
    expect(draft.evidence).toContain("原文提到溪畔活動中心早上還有雨鞋");
    expect(draft.blockers).toContain("缺少最新時間點的更新");
  });

  it("prefills an example draft for M-010", () => {
    const draft = createPhase0DraftForRecord(messyReports[9]);

    expect(draft.messyRecordId).toBe("M-010");
    expect(draft.possibleKind).toBe("site_status_candidate");
    expect(draft.confidence).toBe("medium");
    expect(draft.evidence).toContain("原文提到雨鞋約剩 12 雙");
    expect(draft.blockers).toContain("這是現場志工更新，但仍需確認是否為最新狀態");
  });

  it("prefills example drafts for all messy records", () => {
    const drafts = messyReports.map(createPhase0DraftForRecord);

    expect(drafts).toHaveLength(12);
    expect(drafts.every((draft) => draft.possibleKind !== "unknown")).toBe(true);
    expect(drafts.every((draft) => draft.evidence.trim().length > 0)).toBe(true);
    expect(drafts.every((draft) => draft.blockers.trim().length > 0)).toBe(true);
  });

  it("shows the review note only when the next step is human review", () => {
    expect(shouldShowHumanReviewNote("send_to_human_review")).toBe(true);
    expect(shouldShowHumanReviewNote("keep_raw")).toBe(false);
    expect(shouldShowHumanReviewNote("ask_for_more_info")).toBe(false);
  });

  it("maps the next-step choice to the matching display status", () => {
    expect(getDisplayStatusForNextStep("send_to_human_review", "unknown")).toBe(
      "needs_review",
    );
    expect(getDisplayStatusForNextStep("unverified", "unknown")).toBe(
      "unverified",
    );
    expect(getDisplayStatusForNextStep("keep_raw", "needs_review")).toBe(
      "needs_review",
    );
  });

  it("shows the selected next-step label in the badge", () => {
    expect(getNextStepLabel("send_to_human_review")).toBe("交給人工確認");
    expect(getNextStepLabel("unverified")).toBe("未查核");
    expect(getNextStepLabel("ask_for_more_info")).toBe("補問來源或現場資訊");
  });
});
