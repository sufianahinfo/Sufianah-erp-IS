import { SignInForm } from "@/components/auth/sign-in-form"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image 
              src="/productsImg.jpeg" 
              alt="Sufianah Islamic Store Logo" 
              className="mx-auto mb-6 h-20 w-auto" 
              width={150} 
              height={120}
              priority
              quality={100}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="(max-width: 700px) 100px, 150px"
            />
            <h2 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Sufianah Islamic Store
            </h2>
            <p className="text-muted-foreground text-lg">
              Complete ERP-POS system for Islamic retail management
            </p>
          </div>
          
          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <SignInForm />
          </div>
        </div>
      </div>

      {/* Right side - Product Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary/10 via-secondary/15 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-16 w-16 h-16 bg-secondary/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-8 w-12 h-12 bg-primary/15 rounded-full animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center space-y-8 max-w-md">
            {/* Product Images */}
            <div className="space-y-6">
              <div className="relative">
                <div className="w-40 h-40 mx-auto bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                  <Image 
                    src="/sufianah-logo.svg" 
                    alt="Ketchup Products" 
                    className="w-full h-full object-contain rounded-full"
                    width={160} 
                    height={160}
                    priority
                    quality={100}
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-secondary-foreground">★</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Text */}
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Premium Ketchup Products
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                <p className="text-lg text-muted-foreground font-medium">
                  Quality, quantity, and freshness guaranteed
                </p>
                <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Premium Quality
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Fresh Products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Powered By */}
      <div className="absolute bottom-0 left-0 right-0 lg:bottom-6 lg:right-6 lg:left-auto bg-background/80 backdrop-blur-sm border border-border/50 rounded-none lg:rounded-lg px-3 py-2 lg:px-4 shadow-lg">
        <div className="flex items-center justify-center lg:justify-start gap-1 lg:gap-2">
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs lg:text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Powered By
          </span>
          <span className="text-xs lg:text-sm font-bold text-foreground">
            NUCLEUS ONE ERP
          </span>
        </div>
      </div>
    </div>
  )
}
