"use client"

import Image from "next/image";
import styles from "./page.module.css";
import { useForm } from './contexts/FormContext';

export default function Home() {
  const { veredict, brand, setBrand, url, setUrl, prompt, setPrompt, onSubmit } = useForm()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Image
          className={styles.logo}
          src="/depict.svg"
          alt="Depict logo"
          width={121}
          height={28}
          priority
        />
      </div>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="brand">Brand</label>
          <input className={styles.input} value={brand} onChange={({target}) => setBrand(target.value)} type="text" placeholder="Nike" name="brand" id="brand" />
          <label className={styles.label} htmlFor="url">URL</label>
          <input className={styles.input} value={url} onChange={({target}) => setUrl(target.value)} type="text" placeholder="https://www.nike.com" name="url" id="url" />
          <label className={styles.label} htmlFor="prompt">Prompt</label>
          <textarea className={styles.textArea} value={prompt} onChange={({target}) => setPrompt(target.value)} name="prompt" id="prompt" placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dol..."></textarea>
          <button className={styles.button} onClick={() => onSubmit()}>Check</button>
          <div className={styles.veredict}>{veredict}</div>
        </div>
      </div>
    </div>
  );
}
