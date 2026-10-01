"use client";

import {
  useCallback,
  useState,
} from "react";

import { createRhymeSequence } from "@/lib/rhymes";
import type {
  GameConfig,
  GameSession,
} from "@/types/game";

const INITIAL_SESSION: GameSession = {
  id: 0,
  status: "idle",
  words: [
    "casa",
    "masa",
    "canción",
    "pasión",
  ],
};

export function useGameSession(
  config: GameConfig,
) {
  const [session, setSession] =
    useState<GameSession>(
      INITIAL_SESSION,
    );

  const prepareSession =
    useCallback(() => {
      const words =
        createRhymeSequence(
          config.rhymeScheme,
          config.numberOfBars,
        );

      setSession(
        (previous) => ({
          id: previous.id + 1,
          status: "playing",
          words,
        }),
      );

      return words;
    }, [
      config.numberOfBars,
      config.rhymeScheme,
    ]);

  const stopSession =
    useCallback(() => {
      setSession(
        (previous) => ({
          ...previous,
          status: "stopped",
        }),
      );
    }, []);

  const getWordsForBar =
    useCallback(
      (bar: number) => {
        const {
          words,
        } = session;

        if (words.length === 0) {
          return {
            currentWord: "casa",
            nextWord: "masa",
          };
        }

        const currentIndex =
          (bar - 1) %
          words.length;

        const nextIndex =
          (currentIndex + 1) %
          words.length;

        return {
          currentWord:
            words[currentIndex] ??
            "casa",

          nextWord:
            words[nextIndex] ??
            "masa",
        };
      },
      [session.words],
    );

  return {
    session,
    prepareSession,
    stopSession,
    getWordsForBar,
  };
}