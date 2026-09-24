import type {
  OrganizationChartData,
  OrganizationNode,
} from "@/lib/organization";
import { cn } from "@/lib/utils";
import { MotionDiv } from "@/components/ui/Motion";

import styles from "./OrganizationChart.module.scss";

function OrganizationCard({
  node,
  root = false,
}: {
  node: OrganizationNode;
  root?: boolean;
}) {
  return (
    <MotionDiv
      className={cn(
        styles.node,
        styles[`node_${node.tone}`],
        root && styles.rootNode,
      )}
    >
      <span className={styles.nodeLabel}>{node.label}</span>
      {node.acronym ? (
        <span className={styles.nodeAcronym}>{node.acronym}</span>
      ) : null}
    </MotionDiv>
  );
}

function OrganConnector() {
  return (
    <div className={styles.organConnector} aria-hidden="true">
      <span className={cn(styles.organDrop, styles.organDropLeft)} />
      <span className={cn(styles.organDrop, styles.organDropCenter)} />
      <span className={cn(styles.organDrop, styles.organDropRight)} />
    </div>
  );
}

function MarkerSeries({ data }: { data: OrganizationChartData }) {
  const prefix = data.markers.prefix;
  const firstMarkers = Array.from(
    { length: Math.min(3, data.markers.to - data.markers.from + 1) },
    (_, index) => `${prefix}${data.markers.from + index}`,
  );
  const lastMarker = `${prefix}${data.markers.to}`;
  const showEllipsis = data.markers.to - data.markers.from >= 3;

  return (
    <div className={styles.markerStage}>
      <div
        className={styles.markerGrid}
        role="list"
        aria-label={`Départements ${prefix}${data.markers.from} à ${prefix}${data.markers.to}`}
      >
        {firstMarkers.map((marker) => (
          <span key={marker} className={styles.marker} role="listitem">
            {marker}
          </span>
        ))}
        {showEllipsis ? (
          <span className={styles.markerEllipsis} aria-hidden="true">
            …
          </span>
        ) : null}
        {lastMarker !== firstMarkers[firstMarkers.length - 1] ? (
          <span className={styles.marker} role="listitem">
            {lastMarker}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ChartLegend({ data }: { data: OrganizationChartData }) {
  return (
    <aside className={styles.legend} aria-label="Légende de l’organigramme">
      <span className={styles.legendTitle}>Légende</span>
      <div className={styles.legendItems}>
        <span className={styles.legendItem}>
          <i className={cn(styles.legendSwatch, styles.legendInstitution)} />
          Organes
        </span>
        <span className={styles.legendItem}>
          <i className={cn(styles.legendSwatch, styles.legendCabinet)} />
          Cabinet — rattachement direct à l’autorité
        </span>
        <span className={styles.legendItem}>
          <i className={cn(styles.legendSwatch, styles.legendMarker)} />
          Départements : {data.markers.prefix}1, {data.markers.prefix}2, {data.markers.prefix}3, …, {data.markers.prefix}{data.markers.to}
        </span>
      </div>
    </aside>
  );
}

export default function OrganizationChart({
  data,
}: {
  data: OrganizationChartData;
}) {
  return (
    <section
      className={cn(
        styles.chartSection,
        data.level === "world" ? styles.world : styles.diocesan,
      )}
      aria-labelledby={`organigramme-${data.level}`}
    >
      <header className={styles.chartHeader}>
        <span className={styles.eyebrow}>Organisation structurelle</span>
        <h2 id={`organigramme-${data.level}`}>{data.title}</h2>
        <p>{data.description}</p>
      </header>

      <div className={styles.chartViewport}>
        <div className={styles.governanceStage}>
          <span className={styles.cabinetRelation} aria-hidden="true">
            <span className={styles.cabinetRouteStart} />
            <span className={styles.cabinetRouteRail} />
            <span className={styles.cabinetRouteEnd} />
          </span>

          <div className={styles.authorityStage}>
            <OrganizationCard node={data.authority} root />
          </div>

          <OrganConnector />

          <div className={styles.organsStage}>
            {data.organs.map((organ) => (
              <OrganizationCard key={organ.id} node={organ} />
            ))}
          </div>

          <div className={styles.executiveConnector} aria-hidden="true" />

          <div className={styles.secondaryStage}>
            <div className={styles.executiveFlow}>
              <div className={styles.executiveSlot}>
                <OrganizationCard node={data.executive} />
              </div>
              <div className={styles.departmentConnector} aria-hidden="true" />
            </div>

            <div className={styles.cabinetSlot}>
              <span className={styles.cabinetKicker}>Cabinet</span>
              <OrganizationCard node={data.cabinet} />
            </div>
          </div>
        </div>

        <MarkerSeries data={data} />

        {data.territorialChain?.length ? (
          <div className={styles.territorialStage}>
            {data.territorialChain.map((node) => (
              <div key={node.id} className={styles.territorialItem}>
                <OrganizationCard node={node} />
              </div>
            ))}
          </div>
        ) : null}

        <ChartLegend data={data} />
      </div>
    </section>
  );
}
