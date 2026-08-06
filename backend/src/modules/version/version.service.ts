import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class VersionService {
  constructor(private prisma: PrismaService) {}

  async getLatestVersion(platform: string) {
    return this.prisma.appVersion.findFirst({
      where: { platform, status: 1 },
      orderBy: { versionCode: 'desc' },
    });
  }

  async getVersions(platform?: string) {
    const where: any = {};
    if (platform) where.platform = platform;
    return this.prisma.appVersion.findMany({
      where,
      orderBy: { versionCode: 'desc' },
    });
  }

  async createVersion(data: {
    platform: string; version: string; versionCode: number;
    title: string; content: string; downloadUrl?: string; forceUpdate?: number;
  }) {
    return this.prisma.appVersion.create({ data: { ...data, forceUpdate: data.forceUpdate || 0 } });
  }

  async updateVersion(id: number, data: {
    version?: string; versionCode?: number; title?: string; content?: string;
    downloadUrl?: string; forceUpdate?: number; status?: number;
  }) {
    return this.prisma.appVersion.update({ where: { id }, data });
  }

  async deleteVersion(id: number) {
    return this.prisma.appVersion.delete({ where: { id } });
  }

  async checkUpdate(platform: string, currentVersionCode: number) {
    const latest = await this.getLatestVersion(platform);
    if (!latest || latest.versionCode <= currentVersionCode) {
      return { hasUpdate: false };
    }
    return {
      hasUpdate: true,
      forceUpdate: latest.forceUpdate === 1,
      version: {
        version: latest.version,
        versionCode: latest.versionCode,
        title: latest.title,
        content: latest.content,
        downloadUrl: latest.downloadUrl,
      },
    };
  }
}
