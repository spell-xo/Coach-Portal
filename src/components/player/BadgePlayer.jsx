import ReactCountryFlag from "react-country-flag";
import Avatar from "@mui/material/Avatar";

export default function BadgePlayer({ report, badgeData }) {
  function getBirthYearSafe(input) {
    const d = new Date(input);
    const isValid = !isNaN(d.getTime());

    if (!isValid) return input;

    return d.getUTCFullYear();
  }

  function getGradeByPercent(percent) {
    if (percent < 1) return "ungraded";
    if (percent >= 1 && percent <= 20) return "bronze";
    if (percent >= 21 && percent <= 40) return "silver";
    if (percent >= 41 && percent <= 60) return "gold";
    if (percent >= 61 && percent <= 80) return "platinum";
    if (percent >= 81 && percent <= 100) return "diamond";
    return "ungraded";
  }

  return (
    <div className={`badgePlayer ${getGradeByPercent(badgeData?.highestLevel?.totalScore)}`}>
      <div className="badgePlayer__avatar">
        <Avatar
          variant="square"
          src={badgeData?.profilePicture}
        />
        {badgeData?.country !== "N/A" && (
          <ReactCountryFlag
            countryCode={badgeData?.country}
            svg
            className="badgePlayer__country"
          />
        )}
      </div>
      <div className="badgePlayer__year">{getBirthYearSafe(badgeData?.birthday)}</div>
      <div className={`badgePlayer__top ${badgeData?.highestLevel?.level >= 4 ? "high-level" : ""}`}>
        <p className="num">
          {badgeData?.highestLevel?.level}
          <span>level</span>
        </p>
        <p className="num">
          {badgeData?.highestLevel?.totalScore} <span>total score</span>
        </p>
        <p>
          {getGradeByPercent(badgeData?.highestLevel?.totalScore)} <span>division</span>
        </p>
      </div>
      <img
        className="badgePlayer__badge"
        src={`/images/badges/LV${badgeData?.highestLevel?.level}/${getGradeByPercent(badgeData?.highestLevel?.totalScore)}.webp`}
      />
      <p className="badgePlayer__name">{report?.playerName}</p>
      <div className="badgePlayer__stats">
        <p>
          <span>{badgeData?.skills?.PAC}</span> PAC
        </p>
        <p>
          <span>{badgeData?.skills?.DRI}</span> DRI
        </p>
        <p>
          <span>{badgeData?.skills?.PAS}</span> PAS
        </p>
        <p>
          <span>{badgeData?.skills?.CTR}</span> CTR
        </p>
      </div>
    </div>
  );
}
