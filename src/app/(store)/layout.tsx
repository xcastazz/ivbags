import { getContent } from "@/lib/data";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();
  return (
    <div className="store">
      <Header topbar={content.topbar} />
      <main className="store-main">{children}</main>
      <Footer content={content} />
    </div>
  );
}
