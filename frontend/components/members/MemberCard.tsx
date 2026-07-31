import Image from "next/image";
import type { Member } from "@/lib/types";
import styles from "./MemberCard.module.scss";

export default function MemberCard({ member }: { member: Member }) {
  return (
    <article className={styles.card}>
      <div className={styles.photoWrap}>
        <Image
          src={member.photoUrl}
          alt={member.fullName}
          fill
          sizes="(max-width:768px) 50vw, 25vw"
          className={styles.photo}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{member.fullName}</h3>
        <p className={styles.role}>{member.role}</p>
        {member.responsibility && <p className={styles.responsibility}>{member.responsibility}</p>}
        {member.bio && <p className={styles.bio}>{member.bio}</p>}
      </div>
    </article>
  );
}
