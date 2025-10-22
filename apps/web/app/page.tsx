import styles from './page.module.css';

export default function Page(): JSX.Element {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Seamless Solutions</h1>
        <p className={styles.description}>
          Ready for Cursor build with modern architecture and best practices.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🚀 Fast Development</h3>
            <p>Built with Next.js and TypeScript for rapid development</p>
          </div>
          <div className={styles.feature}>
            <h3>⚡ High Performance</h3>
            <p>Optimized for speed and scalability</p>
          </div>
          <div className={styles.feature}>
            <h3>🔧 Modern Tooling</h3>
            <p>ESLint, Prettier, and TypeScript for code quality</p>
          </div>
        </div>
      </div>
    </main>
  );
}
