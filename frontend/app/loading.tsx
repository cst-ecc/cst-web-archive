import Container from "@/components/layout/Container";
import Loader from "@/components/ui/Loader";
import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <Container className={styles.wrapper}>
      <Loader />
    </Container>
  );
}
