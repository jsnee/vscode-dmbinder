import { ITreeItem } from './ITreeItem';
import { TreeItem, TreeItemCollapsibleState, WorkspaceFolder } from 'vscode';

const CONTEXT_VALUE: string = "WorkspaceFolder";

export class CampaignFolder implements ITreeItem {
    private _workspaceFolder: WorkspaceFolder;

    constructor(workspaceFolder: WorkspaceFolder) {
        this._workspaceFolder = workspaceFolder;
    }

    public getContextValue(): string {
        return CONTEXT_VALUE;
    }

    public getTreeItem(): TreeItem | Thenable<TreeItem> {
        return new TreeItem(this._workspaceFolder.name, TreeItemCollapsibleState.Expanded);
    }

    public async getChildren(): Promise<ITreeItem[]> {
        /*const newProjects: MavenProject[] = [];
        const allProjects: MavenProject[] = [];
        const pomPaths: string[] = await Utils.getAllPomPaths(this._workspaceFolder);
        for (const pomPath of pomPaths) {
            let currentProject: MavenProject = mavenExplorerProvider.getMavenProject(pomPath);
            if (!currentProject) {
                currentProject = new MavenProject(pomPath);
                newProjects.push(currentProject);
            }
            allProjects.push(currentProject);
        }

        await Promise.all(newProjects.map(elem => elem.parsePom()));
        mavenExplorerProvider.updateProjects(...newProjects);
        newProjects.forEach(p => {
            p.modules.forEach(m => {
                const moduleNode: MavenProject = mavenExplorerProvider.getMavenProject(m);
                if (moduleNode) {
                    moduleNode.parent = p;
                }
            });
        });

        if (allProjects.length === 0) {
            return [{
                getTreeItem: () => new vscode.TreeItem("No Maven project found."),
                getContextValue: () => "EmptyNode"
            }];
        }

        switch (Settings.viewType()) {
            case "hierarchical":
                return this.sortByName(allProjects.filter(m => !m.parent));
            case "flat":
                return this.sortByName(allProjects);
            default: return null;
        }*/
        return [{
            getTreeItem: () => new TreeItem("No DMBinder campaign found."),
            getContextValue: () => "EmptyNode"
        }];
    }
}