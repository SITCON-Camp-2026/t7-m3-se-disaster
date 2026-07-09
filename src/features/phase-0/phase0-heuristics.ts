import type {
  Phase0Draft,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
  };
}

export function createPhase0Draft(messyRecordId: string): Phase0Draft {
  return {
    messyRecordId,
    possibleKind: "unknown",
    possibleKindOther: "",
    confidence: "low",
    evidence: "",
    blockers: "",
    suggestedNextStep: "send_to_human_review",
    suggestedNextStepOther: "",
    followUpNote: "",
    unsafeToActDirectly: true,
    humanReviewNote: "",
  };
}

export function shouldShowHumanReviewNote(
  suggestedNextStep: Phase0Draft["suggestedNextStep"],
): boolean {
  return suggestedNextStep === "send_to_human_review";
}

export function shouldShowFollowUpNote(
  suggestedNextStep: Phase0Draft["suggestedNextStep"],
): boolean {
  return suggestedNextStep === "ask_for_more_info";
}

export function shouldShowKindOtherInput(
  possibleKind: Phase0Draft["possibleKind"],
): boolean {
  return possibleKind === "other";
}

export function shouldShowNextStepOtherInput(
  suggestedNextStep: Phase0Draft["suggestedNextStep"],
): boolean {
  return suggestedNextStep === "other";
}

export function getDisplayStatusForNextStep(
  suggestedNextStep: Phase0Draft["suggestedNextStep"],
  currentStatus: string,
): string {
  if (suggestedNextStep === "unverified") {
    return "unverified";
  }

  if (suggestedNextStep === "send_to_human_review") {
    return "needs_review";
  }

  return currentStatus;
}

export function getNextStepLabel(
  suggestedNextStep: Phase0Draft["suggestedNextStep"],
): string {
  switch (suggestedNextStep) {
    case "keep_raw":
      return "先保留原始資訊";
    case "ask_for_more_info":
      return "補問來源或現場資訊";
    case "send_to_human_review":
      return "交給人工確認";
    case "create_candidate_report":
      return "建立候選通報";
    case "create_site_update_suggestion":
      return "建立地點更新建議";
    case "do_not_use_yet":
      return "暫時不要使用";
    case "unverified":
      return "未查核";
    case "other":
      return "其他";
    default:
      return "未知";
  }
}

export function createPhase0DraftForRecord(
  record: Phase0MessyRecord,
): Phase0Draft {
  const draft = createPhase0Draft(record.id);
  const examples: Record<string, Partial<Phase0Draft>> = {
    "M-001": {
      possibleKind: "help_request_candidate",
      confidence: "low",
      evidence:
        "原文提到需要十幾個人清泥\n原文提到光復車站後方\n原文只提到老雜貨店後面，沒有完整定位",
      blockers:
        "地點表述不夠精確\n需求來源未確認\n沒有確認是否真的需要立即清泥",
      humanReviewNote:
        "請現場志工或站務人員確認地點與需求是否成立，並確認是否需要立即派工。",
    },
    "M-002": {
      possibleKind: "site_status_candidate",
      confidence: "medium",
      evidence:
        "原文提到溪畔活動中心早上還有雨鞋\n原文明確指出下午狀況不確定",
      blockers:
        "缺少最新時間點的更新\n沒有確認下午雨鞋是否仍可領取",
      humanReviewNote:
        "請現場志工補上下午的實際存量狀況，避免把早上資訊當成最新狀態。",
    },
    "M-003": {
      possibleKind: "task_candidate",
      confidence: "medium",
      evidence:
        "原文提到老街口不缺鏟子\n原文提到現在比較需要水電\n原文指出單子可能沒更新",
      blockers:
        "沒有確認水電需求的具體位置\n原始來源仍需確認是否為最新單據",
      humanReviewNote:
        "請現場指揮或物資管理人員確認最新需求與是否要更新物資清單。",
    },
    "M-004": {
      possibleKind: "site_status_candidate",
      confidence: "low",
      evidence:
        "原文提到溪畔活動中心還有很多雨鞋\n原文說叫大家直接過去拿",
      blockers:
        "來源是社群說法\n沒有確認是否仍然可領取\n可能違反現場物資分配流程",
      humanReviewNote:
        "請現場站務確認雨鞋庫存與是否能直接開放領用。",
    },
    "M-005": {
      possibleKind: "announcement_candidate",
      confidence: "low",
      evidence:
        "原文提到一張截圖寫著中午前道路封閉\n原文說不知道截圖是哪一天",
      blockers:
        "沒有確認公告來源\n沒有確認公告日期與有效性",
      humanReviewNote:
        "請官方通路或站務人員確認這則封閉訊息是否屬實且是否仍有效。",
    },
    "M-006": {
      possibleKind: "site_status_candidate",
      confidence: "low",
      evidence:
        "原文提到學校側門可當集合點\n原文又提到另一位志工說那裡剛剛淹水",
      blockers:
        "同一地點的狀態互相衝突\n沒有確認集合點是否可安全使用",
      humanReviewNote:
        "請現場志工確認集合點安全性與是否仍適合作為停留處。",
    },
    "M-007": {
      possibleKind: "assignment_candidate",
      confidence: "low",
      evidence:
        "原文提到某工班可支援水電\n原文又提到名單是昨天，今天沒空",
      blockers:
        "支援名單可能已過期\n沒有確認目前是否真的可支援",
      humanReviewNote:
        "請聯繫工班或現場指揮確認當日是否仍可支援。",
    },
    "M-008": {
      possibleKind: "task_candidate",
      confidence: "low",
      evidence:
        "原文提到 A 區先不要再派人\n原文沒有說明原因",
      blockers:
        "缺少原因與上下文\n不確定是任務已完成、道路危險還是人太多",
      humanReviewNote:
        "請現場主管解釋這則指示的原因，避免誤判為已完成任務。",
    },
    "M-009": {
      possibleKind: "site_status_candidate",
      confidence: "medium",
      evidence:
        "原文提到臨時集合點目前仍開放\n原文提到只接受已完成報到的清淤志工\n原文提到一般物資請不要送到此處",
      blockers:
        "仍需確認入口公告是否已同步更新\n需要確認是否有其他志工未被納入規則",
      humanReviewNote:
        "請現場站務確認集合點規則與公告同步狀態。",
    },
    "M-010": {
      possibleKind: "site_status_candidate",
      confidence: "medium",
      evidence:
        "原文提到雨鞋約剩 12 雙\n原文提到飲用水暫時不缺\n原文提到不再收二手衣物\n原文提到下一次現場盤點預計 16:30",
      blockers:
        "這是現場志工更新，但仍需確認是否為最新狀態\n沒有說明盤點是否已經被正式同步\n仍需確認是否有其他物資需求被漏掉",
      humanReviewNote:
        "請現場負責志工或服務台確認這份更新是否已經覆蓋最新狀況，並確認是否要把資訊同步給後續協作人。",
    },
    "M-011": {
      possibleKind: "help_request_candidate",
      confidence: "low",
      evidence:
        "原文提到需要協助搬動大型家具\n原文提到長者不方便使用手機\n原文提到尚未確認是否同意公開完整地址",
      blockers:
        "涉及個人隱私與地址保護\n需要確認長者是否同意協助與是否有其他可用資訊",
      humanReviewNote:
        "請確認長者同意與隱私保護方式，再決定是否進一步分派協助。",
    },
    "M-012": {
      possibleKind: "help_request_candidate",
      confidence: "low",
      evidence:
        "原文提到外地家屬來電\n原文提到疑似需要藥品協助\n原文提到家屬不在現場，無法確認位置",
      blockers:
        "沒有確認親友位置與醫療狀況\n來電者與當事人之間缺少直接確認",
      humanReviewNote:
        "請現場指揮或醫療支援確認是否需要進一步追蹤與是否要建立正式協助流程。",
    },
  };

  const example = examples[record.id];

  if (example) {
    return {
      ...draft,
      ...example,
    };
  }

  return draft;
}
