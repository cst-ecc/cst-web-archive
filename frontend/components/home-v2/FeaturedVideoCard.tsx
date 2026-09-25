"use client";

import { MotionSection } from "@/components/ui/Motion";
import { useCookieConsent } from "@/components/cookies/CookieConsent";
import styles from "./FeaturedVideoCard.module.scss";

export type FeaturedVideo = { youtubeId:string; title:string; description?:string };
export default function FeaturedVideoCard({ video }:{ video:FeaturedVideo }){const {allowed,openSettings}=useCookieConsent();const canLoad=allowed("external");return <MotionSection className={styles.card} ariaLabelledby="home-featured-video" delay={.05} hover><div className={styles.player}>{canLoad?<iframe src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<div style={{display:"grid",placeItems:"center",height:"100%",padding:"1.5rem",textAlign:"center",background:"#f3f7fa"}}><div><strong>Contenu externe désactivé</strong><p style={{margin:".5rem 0",fontSize:".85rem"}}>Autorisez les contenus externes pour afficher cette vidéo YouTube.</p><button type="button" onClick={openSettings} style={{border:0,borderRadius:".6rem",padding:".65rem .8rem",background:"#1F85CE",color:"white",fontWeight:700,cursor:"pointer"}}>Gérer mes préférences</button></div></div>}</div><div className={styles.content}><span className={styles.eyebrow}><i aria-hidden>▶</i>En vidéo</span><h3 id="home-featured-video">{video.title}</h3>{video.description?<p>{video.description}</p>:null}</div></MotionSection>}
