import type { CSSProperties } from "react"

const iconColumns = [
  ["book", "laptop", "flask", "chart", "pen", "diploma"],
  ["brain", "calculator", "ruler", "atom", "book", "chart"],
  ["diploma", "pen", "laptop", "brain", "flask", "calculator"],
  ["chart", "book", "atom", "ruler", "diploma", "pen"],
  ["flask", "brain", "calculator", "laptop", "chart", "book"],
  ["ruler", "diploma", "pen", "atom", "brain", "flask"],
]

function EducationIcon({ name }: { name: string }) {
  switch (name) {
    case "book":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M8 11.5C12.5 9 17 9.5 22 12v27c-5-2.5-9.5-3-14-.5v-27Z" />
          <path d="M40 11.5C35.5 9 31 9.5 26 12v27c5-2.5 9.5-3 14-.5v-27Z" />
          <path d="M22 12h4" />
        </svg>
      )
    case "laptop":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M12 14h24v17H12z" />
          <path d="M7 36h34l-4-5H11l-4 5Z" />
          <path d="M21 34h6" />
        </svg>
      )
    case "flask":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M19 8h10" />
          <path d="M21 8v10L12 35c-1.5 3 0 5 3.5 5h17c3.5 0 5-2 3.5-5l-9-17V8" />
          <path d="M16 32h16" />
          <path d="M19 27h10" />
        </svg>
      )
    case "chart":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M9 38h30" />
          <path d="M12 34l8-9 7 5 10-15" />
          <path d="M12 26v8" />
          <path d="M25 23v11" />
          <path d="M37 17v17" />
        </svg>
      )
    case "pen":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M33 8l7 7-23 23-9 2 2-9L33 8Z" />
          <path d="M29 12l7 7" />
          <path d="M10 31l7 7" />
        </svg>
      )
    case "diploma":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M10 13h28v20H10z" />
          <path d="M16 19h16" />
          <path d="M16 25h10" />
          <circle cx="33" cy="30" r="4" />
          <path d="M31 34v7l2-2 2 2v-7" />
        </svg>
      )
    case "brain":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M19 10c-4 0-7 3-7 7-3 1-5 4-5 8 0 5 4 9 9 9h3V10Z" />
          <path d="M29 10c4 0 7 3 7 7 3 1 5 4 5 8 0 5-4 9-9 9h-3V10Z" />
          <path d="M19 17c-3 0-5 2-5 5" />
          <path d="M29 17c3 0 5 2 5 5" />
          <path d="M19 28c-3 0-5-2-5-5" />
          <path d="M29 28c3 0 5-2 5-5" />
        </svg>
      )
    case "calculator":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <rect x="13" y="7" width="22" height="34" rx="4" />
          <path d="M17 13h14v7H17z" />
          <path d="M18 27h3M24 27h3M30 27h3M18 33h3M24 33h3M30 33h3" />
        </svg>
      )
    case "ruler":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M9 32 32 9l7 7-23 23-7-7Z" />
          <path d="M17 31l-3-3M22 26l-2-2M27 21l-3-3M32 16l-2-2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 8v32" />
          <path d="M12 16c8 5 16 5 24 0" />
          <path d="M12 32c8-5 16-5 24 0" />
          <ellipse cx="24" cy="24" rx="16" ry="7" />
        </svg>
      )
  }
}

export function EducationIconBackground() {
  return (
    <div className="education-bg" aria-hidden="true">
      <div className="education-bg__columns">
        {iconColumns.map((icons, index) => (
          <div
            className="education-bg__column"
            data-direction={index % 2 === 0 ? "up" : "down"}
            style={
              {
                "--duration": `${26 + index * 3}s`,
                "--offset": `${index * 10}px`,
              } as CSSProperties
            }
            key={index}
          >
            {[0, 1].map((track) => (
              <div className="education-bg__track" key={track}>
                {icons.map((icon, iconIndex) => (
                  <span className="education-bg__icon" key={`${icon}-${iconIndex}`}>
                    <EducationIcon name={icon} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
