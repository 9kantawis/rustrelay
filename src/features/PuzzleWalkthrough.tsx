import { useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import type { Language } from "../../shared/contracts";
import puzzleGuides from "../../shared/puzzle-guides.json";
import Dialog from "../components/Dialog";
type Guide = {
  source: string;
  credit: string;
  steps: { image: string; photoSource: string; text: string[] }[];
};
const pictures = import.meta.glob<string>("../assets/puzzles/*", {
  eager: true,
  query: "?url",
  import: "default",
});
export default function PuzzleWalkthrough({
  id,
  language,
  runAction,
}: {
  id: string;
  language: Language;
  runAction: (action: string, payload?: unknown) => Promise<any>;
}) {
  const guide = (puzzleGuides as Record<string, Guide>)[id];
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState("");
  if (!guide) return null;
  const step = guide.steps[index];
  const text = step.text[language === "ru" ? 0 : language === "en" ? 1 : 2];
  const say = (ru: string, en: string, zh: string) =>
    language === "ru" ? ru : language === "en" ? en : zh;
  const image = pictures["../assets/puzzles/" + step.image];
  return (
    <section className="puzzle-walkthrough">
      <div className="guide-section-heading">
        <h3>{say("Как пройти пазл", "Puzzle walkthrough", "谜题步骤")}</h3>
        <span>
          {index + 1} / {guide.steps.length}
        </span>
      </div>
      <div
        className="puzzle-step-tabs"
        aria-label={say("Шаги пазла", "Puzzle steps", "谜题步骤")}
      >
        {guide.steps.map((step, i) => (
          <button
            key={i}
            className={i === index ? "active" : ""}
            aria-current={i === index ? "step" : undefined}
            aria-label={
              i +
              1 +
              ". " +
              step.text[language === "ru" ? 0 : language === "en" ? 1 : 2]
            }
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        className="puzzle-photo"
        aria-busy={loaded !== image}
        onClick={() => setExpanded(true)}
        aria-label={say("Увеличить фото", "Enlarge photo", "放大图片")}
      >
        <img
          key={image}
          src={image}
          alt={text}
          decoding="async"
          onLoad={(event) => {
            const photo = event.currentTarget;
            void photo
              .decode()
              .then(() => setLoaded(image))
              .catch(() => setLoaded(image));
          }}
        />
        <span>
          <Maximize2 size={16} />
        </span>
      </button>
      <p className="puzzle-step-caption">{text}</p>
      <div className="puzzle-step-footer">
        <button
          className="ghost puzzle-credit"
          onClick={() => void runAction("open", guide.source).catch(() => {})}
        >
          {guide.credit}
          <ArrowUpRight size={13} />
        </button>
        <div>
          <button
            className="secondary"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <ChevronLeft size={15} />
            {say("Назад", "Back", "上一步")}
          </button>
          <button
            className="primary"
            disabled={index === guide.steps.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            {say("Дальше", "Next", "下一步")}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      {expanded && (
        <Dialog
          title={say("Фото шага", "Step photo", "步骤图片")}
          className="puzzle-photo-dialog"
          onClose={() => setExpanded(false)}
        >
          <img src={image} alt={text} />
          <p>{text}</p>
        </Dialog>
      )}
    </section>
  );
}
