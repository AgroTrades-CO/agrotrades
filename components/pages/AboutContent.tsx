import Image from "next/image";
import { about, aboutPage, visibleAboutTags, visibleFullText, visibleTeam, visibleValues, type Lang } from "@/content";
import { Icon } from "@/components/icon-map";

export function AboutContent({ lang }: { lang: Lang }) {
  const values = visibleValues(aboutPage);
  const team = visibleTeam;

  return (
    <>
      <div className="page-hero sd-hero">
        <Image
          src={aboutPage.bannerImage}
          alt=""
          aria-hidden="true"
          fill
          className="sd-hero-image"
        />
        <div className="sd-hero-overlay" />
        <div className="page-hero-content">
          <span className="hero-tag">{about.tag[lang]}</span>
          <h1>{about.title[lang]}</h1>
          <p>{about.summary[lang]}</p>
        </div>
      </div>

      <section style={{ background: "white" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {visibleFullText.map((paragraph) => (
            <p key={paragraph.pt} className="section-sub" style={{ maxWidth: "none", marginBottom: 20 }}>
              {paragraph[lang]}
            </p>
          ))}
          <div className="about-tags">
            {visibleAboutTags.map((tag) => (
              <span className="about-tag" key={tag.label.pt}>
                <Icon name={tag.icon} width={16} height={16} /> {tag.label[lang]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {values.length > 0 && (
        <section>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <span className="section-tag">{aboutPage.valuesTag[lang]}</span>
            <h2 className="section-title">{aboutPage.valuesHeading[lang]}</h2>
            <div className="pillar-grid">
              {values.map((value) => (
                <div className="pillar pillar--value" key={value.title.pt}>
                  <div className="pillar-icon-circle">
                    <Icon name={value.icon} width={26} height={26} />
                  </div>
                  <h3>{value.title[lang]}</h3>
                  <p>{value.text[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="section-tag">{aboutPage.teamTag[lang]}</span>
          <h2 className="section-title">{aboutPage.teamHeading[lang]}</h2>

          {team.length > 0 && (
            <div className="team-featured">
              <div className="team-featured-photo">
                <Image src={team[0].foto} alt={team[0].nome} width={200} height={200} />
              </div>
              <div>
                <h3 className="team-featured-name">{team[0].nome}</h3>
                <p className="team-role">{team[0].cargo[lang]}</p>
                {team[0].bio && <p className="team-featured-bio">{team[0].bio[lang]}</p>}
                {team[0].badges && team[0].badges.length > 0 && (
                  <div className="about-tags">
                    {team[0].badges.map((badge) => (
                      <span className="about-tag" key={badge.pt}>
                        {badge[lang]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {team.length > 1 && (
            <div className="team-grid team-grid--rest">
              {team.slice(1).map((member) => (
                <div className="team-card" key={member.nome}>
                  <div className="team-photo">
                    <Image src={member.foto} alt={member.nome} width={96} height={96} />
                  </div>
                  <h3>{member.nome}</h3>
                  <p className="team-role team-role--grid">{member.cargo[lang]}</p>
                  {member.frase && <p className="team-quote">&ldquo;{member.frase[lang]}&rdquo;</p>}
                  {member.badges && member.badges.length > 0 && (
                    <div className="about-tags">
                      {member.badges.map((badge) => (
                        <span className="about-tag" key={badge.pt}>
                          {badge[lang]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
