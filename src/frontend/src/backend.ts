/* eslint-disable */
// @ts-nocheck
import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
import type { Case, Device, SmsRecord, CallRecord, AppRecord, MediaFile, BrowserRecord, LocationRecord, AuditLog, ForensicAlert } from "./declarations/backend.did.d.ts";

export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export class ExternalBlob {
    _blob?: Uint8Array<ArrayBuffer> | null;
    directURL: string;
    onProgress?: (percentage: number) => void = undefined;
    private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null){
        if (blob) {
            this._blob = blob;
        }
        this.directURL = directURL;
    }
    static fromURL(url: string): ExternalBlob {
        return new ExternalBlob(url, null);
    }
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
        const url = URL.createObjectURL(new Blob([
            new Uint8Array(blob)
        ], {
            type: 'application/octet-stream'
        }));
        return new ExternalBlob(url, blob);
    }
    public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
        if (this._blob) {
            return this._blob;
        }
        const response = await fetch(this.directURL);
        const blob = await response.blob();
        this._blob = new Uint8Array(await blob.arrayBuffer());
        return this._blob;
    }
    public getDirectURL(): string {
        return this.directURL;
    }
    public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
        this.onProgress = onProgress;
        return this;
    }
}

export interface backendInterface {
    getAllCases(): Promise<Array<Case>>;
    createCase(caseNumber: string, name: string, description: string, investigator: string): Promise<Case>;
    updateCaseStatus(id: string, status: string): Promise<boolean>;
    getDevices(caseId: string): Promise<Array<Device>>;
    addDevice(caseId: string, model: string, manufacturer: string, androidVersion: string, serialNumber: string, imei: string, batteryLevel: bigint, storageTotal: string, storageUsed: string): Promise<Device>;
    updateDeviceExtractionStatus(deviceId: string, status: string, timestamp: string): Promise<boolean>;
    getSmsRecords(deviceId: string): Promise<Array<SmsRecord>>;
    getCallRecords(deviceId: string): Promise<Array<CallRecord>>;
    getAppRecords(deviceId: string): Promise<Array<AppRecord>>;
    getMediaFiles(deviceId: string): Promise<Array<MediaFile>>;
    getBrowserRecords(deviceId: string): Promise<Array<BrowserRecord>>;
    getLocationRecords(deviceId: string): Promise<Array<LocationRecord>>;
    getAlerts(deviceId: string): Promise<Array<ForensicAlert>>;
    getAuditLogs(caseId: string): Promise<Array<AuditLog>>;
    addAuditLog(caseId: string, action: string, investigator: string, details: string): Promise<AuditLog>;
    addMockEvidence(deviceId: string): Promise<boolean>;
}

export class Backend implements backendInterface {
    constructor(private actor: ActorSubclass<_SERVICE>, private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, private processError?: (error: unknown) => never){}

    async getAllCases(): Promise<Array<Case>> {
        return await this.actor.getAllCases();
    }
    async createCase(caseNumber: string, name: string, description: string, investigator: string): Promise<Case> {
        return await this.actor.createCase(caseNumber, name, description, investigator);
    }
    async updateCaseStatus(id: string, status: string): Promise<boolean> {
        return await this.actor.updateCaseStatus(id, status);
    }
    async getDevices(caseId: string): Promise<Array<Device>> {
        return await this.actor.getDevices(caseId);
    }
    async addDevice(caseId: string, model: string, manufacturer: string, androidVersion: string, serialNumber: string, imei: string, batteryLevel: bigint, storageTotal: string, storageUsed: string): Promise<Device> {
        return await this.actor.addDevice(caseId, model, manufacturer, androidVersion, serialNumber, imei, batteryLevel, storageTotal, storageUsed);
    }
    async updateDeviceExtractionStatus(deviceId: string, status: string, timestamp: string): Promise<boolean> {
        return await this.actor.updateDeviceExtractionStatus(deviceId, status, timestamp);
    }
    async getSmsRecords(deviceId: string): Promise<Array<SmsRecord>> {
        return await this.actor.getSmsRecords(deviceId);
    }
    async getCallRecords(deviceId: string): Promise<Array<CallRecord>> {
        return await this.actor.getCallRecords(deviceId);
    }
    async getAppRecords(deviceId: string): Promise<Array<AppRecord>> {
        return await this.actor.getAppRecords(deviceId);
    }
    async getMediaFiles(deviceId: string): Promise<Array<MediaFile>> {
        return await this.actor.getMediaFiles(deviceId);
    }
    async getBrowserRecords(deviceId: string): Promise<Array<BrowserRecord>> {
        return await this.actor.getBrowserRecords(deviceId);
    }
    async getLocationRecords(deviceId: string): Promise<Array<LocationRecord>> {
        return await this.actor.getLocationRecords(deviceId);
    }
    async getAlerts(deviceId: string): Promise<Array<ForensicAlert>> {
        return await this.actor.getAlerts(deviceId);
    }
    async getAuditLogs(caseId: string): Promise<Array<AuditLog>> {
        return await this.actor.getAuditLogs(caseId);
    }
    async addAuditLog(caseId: string, action: string, investigator: string, details: string): Promise<AuditLog> {
        return await this.actor.addAuditLog(caseId, action, investigator, details);
    }
    async addMockEvidence(deviceId: string): Promise<boolean> {
        return await this.actor.addMockEvidence(deviceId);
    }
}

export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}

export function createActor(canisterId: string, _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, options: CreateActorOptions = {}): Backend {
    const agent = options.agent || HttpAgent.createSync({
        ...options.agentOptions
    });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options.actorOptions
    });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
