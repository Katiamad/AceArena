FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
 
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish
 
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
 
COPY --from=build /app/publish .
# La clé rsaKey.public est déjà dans /app/keys/ car copiée par le .csproj
# Même principe que classpath:rsaKey.public en Java Spring Boot
 
EXPOSE 8082
ENV ASPNETCORE_URLS=http://+:8082
 
ENTRYPOINT ["dotnet", "booking-service.dll"]