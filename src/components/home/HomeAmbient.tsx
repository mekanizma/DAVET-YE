type Props = {
  className?: string;
  tone?: "light" | "dark";
};

/** Decorative ambient motion for homepage backgrounds. aria-hidden; no interaction. */
export default function HomeAmbient({ className = "", tone = "light" }: Props) {
  return (
    <div className={`home-ambient home-ambient--${tone} ${className}`.trim()} aria-hidden="true">
      <span className="home-ambient__orb home-ambient__orb--1" />
      <span className="home-ambient__orb home-ambient__orb--2" />
      <span className="home-ambient__orb home-ambient__orb--3" />
      <span className="home-ambient__ring home-ambient__ring--1" />
      <span className="home-ambient__ring home-ambient__ring--2" />
      <span className="home-ambient__beam" />
      <span className="home-ambient__spark home-ambient__spark--1" />
      <span className="home-ambient__spark home-ambient__spark--2" />
      <span className="home-ambient__spark home-ambient__spark--3" />
      <span className="home-ambient__spark home-ambient__spark--4" />
      <span className="home-ambient__spark home-ambient__spark--5" />
      <span className="home-ambient__spark home-ambient__spark--6" />
      <span className="home-ambient__dust" />
    </div>
  );
}
