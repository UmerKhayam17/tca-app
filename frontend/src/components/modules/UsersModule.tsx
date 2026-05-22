import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, UserX, ImageIcon } from "lucide-react";
import { ModuleActionCaps, PermLevel } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import {
  emptyUserForm,
  tableColumns,
  userToFormValues,
  visibleFormFields,
  type UserFormMode,
  type UserFormValues,
  type UserSchemaField,
  type UserFieldKey,
} from "@/lib/userSchemaFields";
import {
  createStaffUser,
  fetchAllRoles,
  fetchModuleRegistry,
  fetchStaffUsers,
  staffRolesOnly,
  updateStaffUser,
  uploadStaffProfilePhoto,
  normalizeModulePermissions,
  type ModuleRegistryEntry,
  type RoleOption,
  type StaffUser,
} from "@/lib/staffApi";
import { useStaffRealtime } from "@/hooks/useStaffSocket";
import ModuleAccessMatrix from "@/components/modules/ModuleAccessMatrix";
import PanelToolbar from "@/components/modules/PanelToolbar";
import { usePanelListSearch } from "@/hooks/usePanelListSearch";

function setFormField(setter: React.Dispatch<React.SetStateAction<UserFormValues>>, key: UserFieldKey, value: string) {
  setter((prev) => ({ ...prev, [key]: value }));
}

function SchemaFieldControl({
  field,
  mode,
  value,
  onChange,
  roleOptions,
}: {
  field: UserSchemaField;
  mode: UserFormMode;
  value: string;
  onChange: (v: string) => void;
  roleOptions: RoleOption[];
}) {
  const selectOptions =
    field.optionsFrom === "roles"
      ? roleOptions.map((r) => ({ value: r._id, label: r.name }))
      : field.options ?? [];

  const placeholder =
    field.key === "password" && mode === "edit" && field.optionalOnEdit
      ? "Leave blank to keep current password"
      : field.placeholder;

  if (field.inputType === "select") {
    return (
      <select
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required && !(mode === "edit" && field.key === "password")}
      >
        {field.optionsFrom === "roles" && <option value="">Select role…</option>}
        {selectOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.inputType === "number") {
    return (
      <Input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }

  const inputType =
    field.inputType === "email" ? "email" : field.inputType === "tel" ? "tel" : "text";

  return (
    <Input
      type={field.inputType === "password" ? "password" : inputType}
      autoComplete={field.key === "password" ? "new-password" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={
        field.required && !(mode === "edit" && field.key === "password" && field.optionalOnEdit)
      }
    />
  );
}

function formatTableCell(user: StaffUser, key: UserFieldKey): React.ReactNode {
  if (key === "role") {
    const r = user.role;
    if (r && typeof r === "object" && "name" in r) return <span className="capitalize">{(r as RoleOption).name}</span>;
    return "—";
  }
  if (key === "isActive") {
    return (
      <span
        className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
          user.isActive ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
        }`}
      >
        {user.isActive ? "Active" : "Inactive"}
      </span>
    );
  }
  if (key === "salary") {
    const n = Number(user.salary ?? 0);
    return `₨ ${n.toLocaleString()}`;
  }
  const v = user[key as keyof StaffUser];
  if (v === undefined || v === null) return "—";
  return String(v);
}

const STAFF_QUERY = ["staff"] as const;
const ROLES_QUERY = ["staffRoles"] as const;
const REGISTRY_QUERY = ["moduleRegistry"] as const;

const UsersModule = ({ perm: _perm, caps }: { perm: PermLevel; caps: ModuleActionCaps }) => {
  const anyWrite = caps.canCreate || caps.canEdit || caps.canDelete;
  const { toast } = useToast();
  const qc = useQueryClient();
  useStaffRealtime(anyWrite);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: STAFF_QUERY,
    queryFn: fetchStaffUsers,
  });

  const { data: rolesRaw = [] } = useQuery({
    queryKey: ROLES_QUERY,
    queryFn: fetchAllRoles,
  });

  const roleOptions = useMemo(() => staffRolesOnly(rolesRaw), [rolesRaw]);

  const { data: modules = [] } = useQuery({
    queryKey: REGISTRY_QUERY,
    queryFn: fetchModuleRegistry,
  });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<UserFormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormValues>(() => emptyUserForm());
  const [modulePerms, setModulePerms] = useState<Record<string, string[]>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { search, setSearch, filtered: staffFiltered } = usePanelListSearch(staff, (u) => [
    u.name,
    u.email,
    u.phone,
    typeof u.role === "object" && u.role ? (u.role as RoleOption).name : u.role,
    u.isActive ? "active" : "inactive",
  ]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === "create" && !caps.canCreate) throw new Error("You do not have permission to create staff.");
      if (mode === "edit" && !caps.canEdit) throw new Error("You do not have permission to edit staff.");
      const fields = visibleFormFields(mode);
      for (const f of fields) {
        const v = (form[f.key] || "").trim();
        if (f.key === "password" && mode === "edit" && f.optionalOnEdit) continue;
        if (f.required && !v && f.key !== "salary") throw new Error(`${f.label} is required.`);
        if (f.key === "password" && mode === "create" && (!v || v.length < 8)) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (f.key === "password" && mode === "edit" && v && v.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (f.key === "role" && !form.role) throw new Error("Select a role.");
      }

      const salaryNum = Math.max(0, Number(form.salary) || 0);
      const permsPayload = { ...modulePerms };

      if (mode === "create") {
        if (!form.password || form.password.length < 8) throw new Error("Password must be at least 8 characters.");
        const u = await createStaffUser({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone.trim(),
          role: form.role,
          isActive: form.isActive === "true",
          salary: salaryNum,
          modulePermissions: permsPayload,
        });
        if (photoFile) await uploadStaffProfilePhoto(u._id, photoFile);
        return u;
      }
      if (!editingId) throw new Error("Missing user");
      const payload: Parameters<typeof updateStaffUser>[1] = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        isActive: form.isActive === "true",
        salary: salaryNum,
        modulePermissions: permsPayload,
      };
      if (form.password.trim()) payload.password = form.password;
      const u = await updateStaffUser(editingId, payload);
      if (photoFile) await uploadStaffProfilePhoto(editingId, photoFile);
      return u;
    },
    onSuccess: () => {
      toast({ title: mode === "create" ? "Staff member created" : "Staff member updated" });
      void qc.invalidateQueries({ queryKey: STAFF_QUERY });
      setOpen(false);
      clearFormState();
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => {
      if (!caps.canEdit) throw new Error("Not allowed.");
      return updateStaffUser(id, { isActive: false });
    },
    onSuccess: () => {
      toast({ title: "Staff member deactivated" });
      void qc.invalidateQueries({ queryKey: STAFF_QUERY });
    },
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const clearFormState = () => {
    setForm(emptyUserForm());
    setEditingId(null);
    setModulePerms({});
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const openCreate = () => {
    if (!caps.canCreate) return;
    setMode("create");
    clearFormState();
    setOpen(true);
  };

  const openEdit = (u: StaffUser) => {
    if (!caps.canEdit) return;
    setMode("edit");
    setEditingId(u._id);
    setForm(userToFormValues(u));
    setModulePerms(normalizeModulePermissions(u.modulePermissions));
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      if (!u.profileImage) return null;
      if (u.profileImage.startsWith("http")) return u.profileImage;
      return u.profileImage.startsWith("/") ? u.profileImage : `/${u.profileImage}`;
    });
    setOpen(true);
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/image\/(jpeg|png|gif|webp)/i.test(f.type) && !/\.(jpe?g|png|gif|webp)$/i.test(f.name)) {
      toast({ title: "Invalid file", description: "Please choose a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const cols = tableColumns();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Card className="p-4 border-dashed">
        <div className="text-sm font-semibold text-primary mb-1">Staff management</div>
        <p className="text-xs text-muted-foreground">
          Manage <strong>teachers</strong> and <strong>accountants</strong>: contact details, login, salary, profile
          photo (upload), status, and per-module actions. Data loads via React Query and refreshes live when anyone
          updates staff (no manual page reload).
        </p>
      </Card>

      <PanelToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone, role…"
      >
        {caps.canCreate && (
          <Button variant="hero" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        )}
      </PanelToolbar>
        {(caps.canCreate || caps.canEdit) && (
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (!o) clearFormState();
              }}
            >
              <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{mode === "create" ? "Add staff member" : "Edit staff member"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                  <div className="col-span-2 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        id="staff-photo-input"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="sr-only"
                        onChange={onPickPhoto}
                      />
                      <Label htmlFor="staff-photo-input" className="cursor-pointer text-xs text-accent hover:underline">
                        Upload photo
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex-1">
                      Profile picture is stored on the server (not a URL field). Optional — you can add or change it
                      whenever you save.
                    </p>
                  </div>

                  {visibleFormFields(mode).map((field) => (
                    <div key={field.key} className={field.colSpan === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                      <Label className="mb-1.5 block">
                        {field.label}
                        {field.required && !(mode === "edit" && field.key === "password" && field.optionalOnEdit) ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </Label>
                      <SchemaFieldControl
                        field={field}
                        mode={mode}
                        value={form[field.key]}
                        onChange={(v) => setFormField(setForm, field.key, v)}
                        roleOptions={roleOptions}
                      />
                    </div>
                  ))}

                  {modules.length > 0 && (
                    <ModuleAccessMatrix modules={modules} value={modulePerms} onChange={setModulePerms} />
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    variant="hero"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-14">Photo</th>
                {cols.map((c) => (
                  <th key={c.key} className="text-left font-medium px-4 py-3">
                    {c.label}
                  </th>
                ))}
                <th className="text-left font-medium px-4 py-3">Modules</th>
                {(caps.canEdit || caps.canDelete) && <th className="px-4 py-3 w-24" />}
              </tr>
            </thead>
            <tbody>
              {staffLoading ? (
                <tr>
                  <td colSpan={cols.length + 3} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 3} className="px-4 py-8 text-center text-muted-foreground">
                    No teachers or accountants yet.
                  </td>
                </tr>
              ) : staffFiltered.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 3} className="px-4 py-8 text-center text-muted-foreground">
                    No staff match your search.
                  </td>
                </tr>
              ) : (
                staffFiltered.map((u) => {
                  const modCount = u.modulePermissions ? Object.keys(u.modulePermissions).length : 0;
                  const imgSrc = u.profileImage?.startsWith("http")
                    ? u.profileImage
                    : u.profileImage
                      ? u.profileImage.startsWith("/")
                        ? u.profileImage
                        : `/${u.profileImage}`
                      : undefined;
                  return (
                    <tr key={u._id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-2">
                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border border-border">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                      </td>
                      {cols.map((c) => (
                        <td key={c.key} className="px-4 py-3">
                          {formatTableCell(u, c.key)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-muted-foreground">{modCount ? `${modCount} module(s)` : "—"}</td>
                      {(caps.canEdit || caps.canDelete) && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {caps.canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => openEdit(u)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {caps.canEdit && u.isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (window.confirm(`Deactivate ${u.name}?`)) deactivateMutation.mutate(u._id);
                              }}
                              aria-label="Deactivate"
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UsersModule;
