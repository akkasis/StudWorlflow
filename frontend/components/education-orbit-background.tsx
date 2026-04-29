import type { CSSProperties } from "react"
import { EducationIcon } from "@/components/education-icon-background"

const orbitIcons = [
  { name: "book", angle: 0, radius: "clamp(7rem, 17vw, 13rem)", duration: "34s", direction: "cw", scale: 1 },
  { name: "laptop", angle: 45, radius: "clamp(8rem, 19vw, 15rem)", duration: "38s", direction: "ccw", scale: 0.9 },
  { name: "formula", angle: 90, radius: "clamp(6.5rem, 16vw, 12rem)", duration: "30s", direction: "cw", scale: 0.82 },
  { name: "flask", angle: 135, radius: "clamp(8rem, 20vw, 15.5rem)", duration: "42s", direction: "ccw", scale: 1.05 },
  { name: "chart", angle: 180, radius: "clamp(7.25rem, 18vw, 13.5rem)", duration: "36s", direction: "cw", scale: 0.92 },
  { name: "diploma", angle: 225, radius: "clamp(8.5rem, 20vw, 16rem)", duration: "44s", direction: "ccw", scale: 1 },
  { name: "brain", angle: 270, radius: "clamp(6.75rem, 16vw, 12.5rem)", duration: "32s", direction: "cw", scale: 0.86 },
  { name: "pen", angle: 315, radius: "clamp(8rem, 19vw, 15rem)", duration: "40s", direction: "ccw", scale: 0.96 },
  { name: "calculator", angle: 28, radius: "clamp(4.5rem, 11vw, 8rem)", duration: "28s", direction: "ccw", scale: 0.72 },
  { name: "atom", angle: 208, radius: "clamp(4.75rem, 12vw, 8.5rem)", duration: "26s", direction: "cw", scale: 0.76 },
]

export function EducationOrbitBackground() {
  return (
    <div className="education-orbit-bg" aria-hidden="true">
      <div className="education-orbit-bg__center" />
      {orbitIcons.map((icon) => (
        <span
          className="education-orbit-bg__item"
          data-direction={icon.direction}
          key={`${icon.name}-${icon.angle}`}
          style={
            {
              "--angle": `${icon.angle}deg`,
              "--radius": icon.radius,
              "--duration": icon.duration,
              "--scale": icon.scale,
            } as CSSProperties
          }
        >
          <span className="education-orbit-bg__icon">
            <EducationIcon name={icon.name} />
          </span>
        </span>
      ))}
    </div>
  )
}
