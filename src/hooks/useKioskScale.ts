import { useEffect, useState } from "react";
import { KIOSK_DESIGN_W, KIOSK_DESIGN_H, KIOSK_THRESHOLD_W, KIOSK_THRESHOLD_H } from "../config";

function calcScale(): number | null {
  if (window.innerWidth <= KIOSK_THRESHOLD_W || window.innerHeight <= KIOSK_THRESHOLD_H)
    return null;
  return Math.min(window.innerWidth / KIOSK_DESIGN_W, window.innerHeight / KIOSK_DESIGN_H);
}

export function useKioskScale() {
  const [scale, setScale] = useState(calcScale);

  useEffect(() => {
    const apply = () => setScale(calcScale());
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return scale;
}
