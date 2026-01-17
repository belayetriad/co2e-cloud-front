export type NavChild = { title: string; href: string };
export type NavItem = {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavChild[];
};
