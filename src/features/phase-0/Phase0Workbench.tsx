import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import {
  createPhase0Draft,
  createPhase0DraftForRecord,
  createPhase0Judgement,
  getDisplayStatusForNextStep,
  getNextStepLabel,
  shouldShowFollowUpNote,
  shouldShowHumanReviewNote,
  shouldShowKindOtherInput,
  shouldShowNextStepOtherInput,
} from "./phase0-heuristics";
import type { Phase0Draft, Phase0MessyRecord } from "./phase0-types";

const possibleKindOptions = [
  { value: "help_request_candidate", label: "求助候選" },
  { value: "site_status_candidate", label: "地點狀態候選" },
  { value: "task_candidate", label: "任務候選" },
  { value: "assignment_candidate", label: "人員指派候選" },
  { value: "announcement_candidate", label: "公告候選" },
  { value: "unknown", label: "候選類型待判斷" },
  { value: "other", label: "其他" },
] as const;

const confidenceOptions = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
] as const;

const nextStepOptions = [
  { value: "keep_raw", label: "先保留原始資訊" },
  { value: "ask_for_more_info", label: "補問來源或現場資訊" },
  { value: "send_to_human_review", label: "交給人工確認" },
  { value: "create_candidate_report", label: "建立候選通報" },
  { value: "create_site_update_suggestion", label: "建立地點更新建議" },
  { value: "do_not_use_yet", label: "暫時不要使用" },
  { value: "unverified", label: "未查核" },
  { value: "other", label: "其他" },
] as const;

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const [drafts, setDrafts] = useState<Record<string, Phase0Draft>>({});

  const draft = useMemo(() => {
    if (!selectedRecord) {
      return createPhase0Draft("");
    }

    return (
      drafts[selectedRecord.id] ??
      createPhase0DraftForRecord(selectedRecord)
    );
  }, [drafts, selectedRecord]);

  const showHumanReviewNote = shouldShowHumanReviewNote(
    draft.suggestedNextStep,
  );
  const showFollowUpNote = shouldShowFollowUpNote(draft.suggestedNextStep);
  const showKindOtherInput = shouldShowKindOtherInput(draft.possibleKind);
  const showNextStepOtherInput = shouldShowNextStepOtherInput(
    draft.suggestedNextStep,
  );
  const displayStatus = getDisplayStatusForNextStep(
    draft.suggestedNextStep,
    selectedRecord.verificationStatus,
  );
  const nextStepLabel = getNextStepLabel(draft.suggestedNextStep);

  function updateDraft(field: keyof Phase0Draft, value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [selectedRecord.id]: {
        ...(current[selectedRecord.id] ?? createPhase0Draft(selectedRecord.id)),
        [field]: value,
      },
    }));
  }

  function resetDraft() {
    setDrafts((current) => ({
      ...current,
      [selectedRecord.id]: createPhase0Draft(selectedRecord.id),
    }));
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
          補上；這不是 runtime LLM 分析，也不是正式資料模型。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <section className="judgement-card">
            <div className="judgement-card__header">
              <div>
                <p className="eyebrow">整理草稿</p>
                <h3>為這筆原始資訊建立草稿</h3>
              </div>
              <StatusBadge status={displayStatus} />
              <span className="status-badge status-neutral">{nextStepLabel}</span>
            </div>

            <p>
              這份草稿是給學員在工作台中手動填寫的簡化版本，目的是把原始資訊與候選判斷分開看。
            </p>

            <label>
              這筆看起來像什麼
              <select
                value={draft.possibleKind}
                onChange={(event) =>
                  updateDraft("possibleKind", event.target.value)
                }
              >
                {possibleKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {showKindOtherInput ? (
              <label>
                其他說明
                <input
                  value={draft.possibleKindOther}
                  onChange={(event) =>
                    updateDraft("possibleKindOther", event.target.value)
                  }
                  placeholder="請簡短說明"
                />
              </label>
            ) : null}

            <label>
              信心程度
              <select
                value={draft.confidence}
                onChange={(event) =>
                  updateDraft("confidence", event.target.value)
                }
              >
                {confidenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              證據
              <textarea
                value={draft.evidence}
                onChange={(event) => updateDraft("evidence", event.target.value)}
                rows={2}
                placeholder="簡短寫下關鍵線索"
              />
            </label>

            <label>
              卡住點
              <textarea
                value={draft.blockers}
                onChange={(event) => updateDraft("blockers", event.target.value)}
                rows={2}
                placeholder="例如：地點不明"
              />
            </label>

            <label>
              建議下一步
              <select
                value={draft.suggestedNextStep}
                onChange={(event) =>
                  updateDraft("suggestedNextStep", event.target.value)
                }
              >
                {nextStepOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {showNextStepOtherInput ? (
              <label>
                其他說明
                <input
                  value={draft.suggestedNextStepOther}
                  onChange={(event) =>
                    updateDraft("suggestedNextStepOther", event.target.value)
                  }
                  placeholder="請簡短說明"
                />
              </label>
            ) : null}

            {showFollowUpNote ? (
              <label>
                補問備註
                <textarea
                  value={draft.followUpNote}
                  onChange={(event) =>
                    updateDraft("followUpNote", event.target.value)
                  }
                  rows={2}
                  placeholder="需要補什麼訊息"
                />
              </label>
            ) : null}

            {showHumanReviewNote ? (
              <label>
                確認備註
                <textarea
                  value={draft.humanReviewNote}
                  onChange={(event) =>
                    updateDraft("humanReviewNote", event.target.value)
                  }
                  rows={2}
                  placeholder="誰需要確認"
                />
              </label>
            ) : null}

            <div className="draft-actions">
              <button type="button" onClick={resetDraft}>
                重設草稿
              </button>
            </div>
          </section>

          <Phase0JudgementCard
            judgement={safetyBoundary}
            record={selectedRecord}
          />
        </div>

        <aside className="workbench__checklist">
          <h3>第一階段完成檢查</h3>
          <ul>
            <li>Starter 已載入 {records.length} 筆原始資訊</li>
            <li>請 agent 加上建立、編輯、刪除或重設整理草稿</li>
            <li>至少讓 6 筆原始資訊被嘗試整理成可編輯草稿</li>
            <li>至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>
              把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
