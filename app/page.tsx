import Image from 'next/image';
import Scene from '@/components/Scene';
import styles from './page.module.css';

/**
 * Server Component: la copia y la estructura se renderizan en el servidor
 * (Node) y llegan como HTML. Solo `Scene` —la parte interactiva— se hidrata
 * en el cliente, y recibe este contenido como `children`.
 */
export default function Page() {
  return (
    <main>
      <Scene>
        <p className={styles.eyebrow}>
          <span className={styles.rule} aria-hidden="true" />
          21 de Septiembre
          <span className={styles.rule} aria-hidden="true" />
        </p>

        <h1 className={styles.title}>
          Happy
          <br />
          <span className={styles.accent}>Yellow</span> Flowers
          <br />
          Day
        </h1>

        <div className={styles.divider} aria-hidden="true" />

        <p className={styles.subtitle}>
          Dicen que las flores amarillas son promesas de sol y días felices. Te mando unas
          cuantas, porque cada una lleva un pedacito del cariño que te tengo. Diviértete plantando
          flores o haciendo llover pétalos. 🌼✨
        </p>

        <div className={styles.mascot}>
          <span className={styles.mascotFrame}>
            <Image
              src="/assets/images/togepi-happy.gif"
              alt="Togepi feliz"
              width={34}
              height={34}
              className={styles.mascotImg}
              unoptimized
              priority
            />
          </span>
          <span className={styles.mascotText}>Hecho con luz y pétalos</span>
        </div>
      </Scene>
    </main>
  );
}
