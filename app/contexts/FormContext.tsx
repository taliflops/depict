'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';

export type FormContextType = {
  veredict: string,
  brand: string,
  setBrand: (brand: string) => void,
  url: string,
  setUrl: (url: string) => void,
  prompt: string,
  setPrompt: (prompt: string) => void,
  onSubmit: () => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState('')
  const [url, setUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [veredict, setVeredict] = useState('')

  const onSubmit = async () => {
    if (!brand) {
      setVeredict('Please add a brand.')
      return
    }
    if (!url) {
      setVeredict('Please add a URL.')
      return
    }
    if (!prompt) {
      setVeredict('Please add a prompt.')
      return
    }
    const response = await (await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, url }),
    })).json()

    setVeredict(response)
  };

  return (
    <FormContext.Provider value={{ veredict, brand, setBrand, url, setUrl, prompt, setPrompt, onSubmit }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) throw new Error('useForm must be used within a FormProvider');
  return context;
}
