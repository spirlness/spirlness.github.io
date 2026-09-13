import {
  Award,
  BookOpen,
  FileText,
  Folder,
  GraduationCap,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { updateIcons, type UpdateIcon } from "./content-schemas";

export const updateIconNames: readonly UpdateIcon[] = updateIcons;

export const updateIconComponents: Record<UpdateIcon, LucideIcon> = {
  award: Award,
  book: BookOpen,
  graduation: GraduationCap,
  project: Folder,
  publication: FileText,
  blog: Newspaper,
};

export const updateIconClassName: Record<UpdateIcon, string> = {
  award: "w-4 h-4 text-orange-500",
  book: "w-4 h-4 text-blue-500",
  graduation: "w-4 h-4 text-purple-500",
  project: "w-4 h-4 text-green-500",
  publication: "w-4 h-4 text-red-500",
  blog: "w-4 h-4 text-indigo-500",
};
