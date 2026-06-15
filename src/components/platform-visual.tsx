export function PlatformVisual() {
  return (
    <div className="platform-visual" aria-label="Powerlifting platform and market board">
      <div className="visual-board visual-board-left">
        <span>YES</span>
        <strong>70</strong>
      </div>
      <div className="visual-board visual-board-right">
        <span>NO</span>
        <strong>30</strong>
      </div>
      <div className="barbell">
        <span className="plate plate-left" />
        <span className="bar" />
        <span className="plate plate-right" />
      </div>
      <div className="rack">
        <span />
        <span />
      </div>
      <div className="platform-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
