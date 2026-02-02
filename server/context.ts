import { createContext } from "react-router";
import type { BaseContext } from "$/server/types";

export const appContext = createContext<BaseContext>();
