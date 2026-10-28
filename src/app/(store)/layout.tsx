import { getContent, getProducts } from "@/lib/data";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [content, products] = await Promise.all([getContent(), getProducts()]);
  return (
    <div className="store">
      <Header topbar={content.topbar} products={products} />
      <main className="store-main">{children}</main>
      <Footer content={content} />
      <WhatsAppFloat phone={content.whatsapp} />
    </div>
  );
}
