import { ChallengeMethod } from "../components/challenge-method";
import { DailyProgressOverview } from "../components/daily-progress-overview";
import { PushUpRitualHero } from "../components/push-up-ritual-hero";
import { StartTodayCta } from "../components/start-today-cta";

export function PupzHomepage() {
  return (
    <div>
      <PushUpRitualHero />
      <DailyProgressOverview />
      <ChallengeMethod />
      <StartTodayCta />
    </div>
  );
}
