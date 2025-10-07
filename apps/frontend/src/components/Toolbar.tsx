import "./styles/Toolbar.css";

export default function Toolbar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="toolbar">
      <h1 className="toolbar__title">{title}</h1>
      <div className="toolbar__right">{right}</div>
    </div>
  );
}
