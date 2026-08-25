import { useEffect } from "react";

import * as Sentry from "@sentry/react";
import { Link } from "@tanstack/react-router";

import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

interface ErrorComponentProps {
  error?: unknown;
}

export function ErrorComponent({ error }: ErrorComponentProps = {}) {
  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h4>Something went wrong</h4>
      <p>
        An error occurred while rendering this page. You can{" "}
        <span
          className="cursor-pointer text-giga-blue"
          onClick={() => {
            window.location.reload();
          }}
        >
          reload
        </span>{" "}
        the page, or go back{" "}
        <Link
          to="/"
          search={{ page: DEFAULT_PAGE_NUMBER, page_size: DEFAULT_PAGE_SIZE }}
        >
          home
        </Link>
        .
      </p>
      <p>
        You can also report it in our{" "}
        <a
          href="https://github.com/unicef/giga-data-ingestion/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Issues
        </a>
        .
      </p>
    </div>
  );
}
